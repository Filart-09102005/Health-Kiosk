import argparse
import json
import logging
import os
import queue
import signal
import sys
import uuid
import threading
import time
from enum import Enum, auto

import requests
import serial
from serial.tools import list_ports

BRIDGE_VERSION = "2026-07-05-json-v3"
SUPPORTED_PROTOCOLS = {"2.0"}
CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")

# Mirrors arduino/HealthKioskFirmware/src/config/ErrorCodes.h
ERROR_CODE_MESSAGES = {
    1001: "The measurement took too long to complete. Please try again and hold still.",
    1002: "The sensor could not be reached. Please notify kiosk staff.",
    1003: "We lost a steady reading. Your finger (or the part being measured) may have moved, "
          "or the signal was too weak. Please hold still and try again.",
    1004: "The reading was outside the expected range. Please try again.",
    1005: "This sensor needs to be recalibrated before it can take a reading. Please notify kiosk staff.",
    2001: "An internal command error occurred. Please try again.",
    2002: "An internal data error occurred. Please try again.",
    9001: "The device restarted unexpectedly during the measurement. Please try again.",
}


def error_code_to_message(raw_code):
    try:
        code = int(raw_code)
    except (TypeError, ValueError):
        return "An unknown error occurred. Please try again."
    return ERROR_CODE_MESSAGES.get(code, f"An unknown error occurred (code {code}). Please try again.")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("Bridge")

class BridgeState(Enum):
    STARTING = auto()
    SEARCH_PORT = auto()
    CONNECTING = auto()
    VERIFY_PROTOCOL = auto()
    READY = auto()
    RECOVER = auto()

class HealthKioskBridge:
    def __init__(self, config):
        self.port = config.get("port")
        self.baud = config.get("baud", 115200)
        self.live_url = config.get("url", "http://127.0.0.1:8000/api/kiosk/live-vitals")
        self.cmd_url = config.get("command_url", "http://127.0.0.1:8000/api/kiosk/command")
        # The live-vitals/command endpoints used to accept any request. They
        # now require this shared secret (see KIOSK_BRIDGE_TOKEN in the
        # Laravel app's .env) since the bridge has no user session to
        # authenticate with otherwise. Without it every request here gets a
        # 401 - set it via config.json ("bridge_token") or --bridge-token.
        self.bridge_token = config.get("bridge_token") or ""
        self.auth_headers = {"X-Kiosk-Bridge-Token": self.bridge_token} if self.bridge_token else {}
        if not self.bridge_token:
            logger.error("No bridge_token configured (scripts/config.json or --bridge-token): "
                         "Laravel will reject every request with 401 and measurements will fail.")

        self.state = BridgeState.STARTING
        self.serial_conn = None
        
        self.http_queue = queue.Queue(maxsize=100)
        self.shutdown_event = threading.Event()
        
        self.stats = {
            "connected": False,
            "port": self.port,
            "firmware_version": "unknown",
            "protocol_version": "unknown",
            "reconnect_count": 0,
            "last_measurement_time": 0,
            "last_http_post": 0
        }
        
        self.last_sequence = -1
        self.last_laravel_payload = None
        self.last_payload_time = 0
        self.current_session_id = str(uuid.uuid4())
        
        self.http_thread = threading.Thread(target=self._http_worker, daemon=False)
        self.http_thread.start()

    def translate_payload_to_laravel(self, packet):
        try:
            payload = packet.get("payload", {})
            p_type = packet.get("type", "")
            
            if p_type == "measurement":
                sensor = payload.get("sensor", "")
                status = payload.get("status", "")
                
                out = {}
                if sensor == "TEMPERATURE":
                    out["sensor"] = "TEMPERATURE"
                elif sensor == "WEIGHT":
                    out["sensor"] = "WEIGHT"
                elif sensor == "HEIGHT":
                    out["sensor"] = "HEIGHT"
                elif sensor == "HEART":
                    out["sensor"] = "HEART"

                out["session_id"] = getattr(self, "current_session_id", str(uuid.uuid4()))
                out["version"] = 1
                
                if status == "SUCCESS":
                    out["machine_state"] = "COMPLETE"
                    out["final_result"] = {
                        "primary": payload.get("value"),
                        "secondary": payload.get("secondaryValue")
                    }
                elif status == "ERROR":
                    out["machine_state"] = "FAILED"
                    raw_code = payload.get("errorCode")
                    out["error"] = error_code_to_message(raw_code)
                    out["error_code"] = raw_code  # keep the numeric code for logs/support
                else:
                    out["machine_state"] = status # e.g. WAITING, COLLECTING, DETECTING
                    out["live_data"] = {
                        "primary": payload.get("value"),
                        "secondary": payload.get("secondaryValue"),
                        "debug_ir": payload.get("debug_ir")
                    }
                    
                if out.get("sensor") == "HEART" and out.get("live_data") and out["live_data"].get("debug_ir") is not None:
                    logger.info(f"Oximeter DEBUG_IR: {out['live_data']['debug_ir']}")
                    
                return out
                
            elif p_type == "info":
                info_type = payload.get("infoType")
                if info_type == "BOOT":
                    return {"reset": True, "machine_state": "IDLE"}
                elif info_type == "PONG":
                    return None # Do not overwrite the JSON cache with IDLE on heartbeat
                    
            elif p_type == "error":
                # Only reset on hard errors from the bridge/system, not measurement failures
                return {
                    "machine_state": "FAILED", 
                    "error": payload.get("message"),
                    "sensor": "UNKNOWN",
                    "session_id": getattr(self, "current_session_id", str(uuid.uuid4())),
                    "version": 1
                }
                
            return None
        except Exception as e:
            logger.error(f"Translation error: {e}")
            return None

    def _http_worker(self):
        while not self.shutdown_event.is_set() or not self.http_queue.empty():
            try:
                payload = self.http_queue.get(timeout=0.5)
            except queue.Empty:
                continue
                
            delays = [1, 2, 4, 8]
            success = False
            for attempt, delay in enumerate(delays):
                if self.shutdown_event.is_set() and attempt > 0:
                    break # Fast exit on shutdown
                try:
                    response = requests.post(self.live_url, json=payload, headers=self.auth_headers, timeout=5)
                    response.raise_for_status()
                    self.stats["last_http_post"] = time.time()
                    logger.info(f"HTTP Post Success: {payload}")
                    success = True
                    break
                except requests.RequestException as e:
                    logger.warning(f"HTTP Post Failed (Attempt {attempt+1}/{len(delays)}): {e}. Retrying in {delay}s...")
                    time.sleep(delay)
                    
            if not success:
                logger.error(f"HTTP Post completely failed. Dropping payload: {payload}")
                
            self.http_queue.task_done()
        logger.info("HTTP Worker shut down cleanly.")

    def _close_serial(self):
        if self.serial_conn and self.serial_conn.is_open:
            try:
                self.serial_conn.close()
            except:
                pass
        self.serial_conn = None
        self.stats["connected"] = False

    def shutdown(self):
        logger.info("Initiating shutdown...")
        self.shutdown_event.set()
        self._close_serial()
        self.http_thread.join(timeout=5)
        logger.info("Shutdown complete.")

    def run(self):
        logger.info(f"Starting Bridge v{BRIDGE_VERSION}")
        last_command_poll = 0
        last_command_id = None
        last_serial_rx = time.time()
        last_diag_poll = time.time()
        
        while not self.shutdown_event.is_set():
            try:
                if self.state == BridgeState.STARTING:
                    self.state = BridgeState.SEARCH_PORT
                    
                elif self.state == BridgeState.SEARCH_PORT:
                    if self.port:
                        self.state = BridgeState.CONNECTING
                    else:
                        ports = list(list_ports.comports())
                        if ports:
                            self.port = ports[0].device
                            self.stats["port"] = self.port
                            logger.info(f"Auto-detected port: {self.port}")
                            self.state = BridgeState.CONNECTING
                        else:
                            logger.warning("No serial ports found. Retrying in 5s...")
                            time.sleep(5)
                            
                elif self.state == BridgeState.CONNECTING:
                    try:
                        self._close_serial()
                        self.serial_conn = serial.Serial(self.port, self.baud, timeout=1.0)
                        time.sleep(2)
                        self.serial_conn.reset_input_buffer()
                        self.stats["connected"] = True
                        self.stats["reconnect_count"] += 1
                        self.last_sequence = -1 # Reset sequence on reconnect
                        logger.info(f"Connected to {self.port}")
                        self.state = BridgeState.VERIFY_PROTOCOL
                    except serial.SerialException as e:
                        logger.error(f"Connection failed: {e}. Retrying in 5s...")
                        time.sleep(5)
                        
                elif self.state == BridgeState.VERIFY_PROTOCOL:
                    # Opening the port resets an Arduino Mega (DTR), and the firmware then runs
                    # its bootloader + sensor self-test (several seconds) before answering.
                    # Keep asking and skip boot chatter instead of giving up (giving up closes
                    # the port, which resets the board again and loops forever).
                    verified = False
                    deadline = time.time() + 20.0
                    next_ask = 0.0
                    while time.time() < deadline and not verified:
                        if time.time() >= next_ask:
                            self.serial_conn.write(b"GET_VERSION\n")
                            self.serial_conn.flush()
                            next_ask = time.time() + 2.0
                        response = self.serial_conn.readline().decode('utf-8', errors='ignore').strip()
                        if not response:
                            continue
                        last_serial_rx = time.time()
                        try:
                            packet = json.loads(response)
                        except json.JSONDecodeError:
                            logger.debug(f"Ignoring non-JSON during handshake: {response}")
                            continue
                        if packet.get("protocol") in SUPPORTED_PROTOCOLS and packet.get("type") == "info" and packet.get("payload", {}).get("infoType") == "VERSION":
                            self.stats["firmware_version"] = packet.get("firmware", "unknown")
                            self.stats["protocol_version"] = packet.get("protocol", "unknown")
                            logger.info(f"Protocol verified. Firmware v{self.stats['firmware_version']}")
                            verified = True
                        else:
                            logger.info(f"Boot/handshake chatter: {response}")
                    if verified:
                        self.last_sequence = -1
                        self.state = BridgeState.READY
                    else:
                        logger.error("No response to GET_VERSION within 20s (board hung or wrong firmware?).")
                        self.state = BridgeState.RECOVER
                        
                elif self.state == BridgeState.READY:
                    now = time.time()
                    
                    # 1. Heartbeat
                    if now - last_serial_rx > 5.0:
                        self.serial_conn.write(b"PING\n")
                        self.serial_conn.flush()
                        last_serial_rx = now # reset to avoid spamming
                        
                    # 2. Periodic Diagnostics
                    if now - last_diag_poll > 60.0:
                        self.serial_conn.write(b"GET_DIAGNOSTICS\n")
                        self.serial_conn.flush()
                        last_diag_poll = now
                        
                    # 3. Poll Commands from Laravel
                    if now - last_command_poll >= 1.0:
                        last_command_poll = now
                        try:
                            cmd_data = requests.get(self.cmd_url, headers=self.auth_headers, timeout=3).json()
                            cmd = cmd_data.get("command")
                            cmd_id = cmd_data.get("id")
                            if cmd and cmd_id != last_command_id:
                                logger.info(f"Sending command to Arduino: {cmd}")
                                if cmd.startswith("START"):
                                    self.current_session_id = str(cmd_id)
                                self.serial_conn.write(f"{cmd}\n".encode('utf-8'))
                                self.serial_conn.flush()
                                last_command_id = cmd_id
                        except requests.RequestException:
                            pass 
                    
                    # 4. Read Serial
                    if self.serial_conn.in_waiting > 0:
                        line = self.serial_conn.readline().decode('utf-8', errors='ignore').strip()
                        if line:
                            last_serial_rx = time.time()
                            logger.debug(f"RAW: {line}")
                            try:
                                packet = json.loads(line)
                                if "protocol" not in packet or "type" not in packet or "payload" not in packet:
                                    if "sensor" in packet and "status" in packet:
                                        # Boot self-test line: the board just (re)started.
                                        logger.warning(f"Board self-test line (firmware rebooted?): {line}")
                                        self.last_sequence = -1
                                    else:
                                        logger.warning(f"Malformed packet missing required fields: {line}")
                                    continue

                                seq = packet.get("sequence", -1)
                                is_boot = packet.get("type") == "info" and packet.get("payload", {}).get("infoType") == "BOOT"
                                if is_boot:
                                    logger.warning("Firmware BOOT packet received - board restarted. Resetting sequence.")
                                    self.last_sequence = -1
                                if seq != -1:
                                    if seq < self.last_sequence and seq <= 3:
                                        logger.warning(f"Sequence restarted ({self.last_sequence} -> {seq}); assuming board reboot.")
                                        self.last_sequence = -1
                                    if seq <= self.last_sequence:
                                        logger.warning(f"Duplicate/Old packet detected (seq {seq} <= {self.last_sequence}). Dropping.")
                                        continue
                                    elif self.last_sequence != -1 and seq != self.last_sequence + 1:
                                        logger.warning(f"Packet loss detected: expected {self.last_sequence + 1}, got {seq}")
                                    self.last_sequence = seq
                                    
                                arduino_time = packet.get("timestamp", 0)
                                logger.debug(f"Arduino Uptime: {arduino_time}ms, Local: {time.time()}")
                                
                                if packet.get("type") == "measurement":
                                    self.stats["last_measurement_time"] = time.time()
                                    
                                if packet.get("type") == "info" and packet.get("payload", {}).get("infoType") == "DIAGNOSTICS":
                                    logger.info(f"Diagnostics: {packet.get('payload', {}).get('message')}")
                                    continue
                                    
                                laravel_payload = self.translate_payload_to_laravel(packet)
                                if laravel_payload:
                                    is_state_change = False
                                    if self.last_laravel_payload:
                                        if laravel_payload.get("machine_state") != self.last_laravel_payload.get("machine_state"):
                                            is_state_change = True
                                    else:
                                        is_state_change = True
                                        
                                    if is_state_change or (time.time() - self.last_payload_time >= 1.0):
                                        self.last_payload_time = time.time()
                                        self.last_laravel_payload = laravel_payload
                                        try:
                                            self.http_queue.put_nowait(laravel_payload)
                                        except queue.Full:
                                            try:
                                                self.http_queue.get_nowait()
                                                logger.warning("Queue overflow! Dropped oldest payload.")
                                            except queue.Empty:
                                                pass
                                            self.http_queue.put_nowait(laravel_payload)
                                        
                            except json.JSONDecodeError:
                                logger.warning(f"Failed to parse JSON: {line}")
                                
            except serial.SerialException as e:
                logger.error(f"Serial error: {e}")
                self.state = BridgeState.RECOVER
            except Exception as e:
                logger.error(f"Unexpected error: {e}")
                self.state = BridgeState.RECOVER
                
            if self.state == BridgeState.RECOVER:
                logger.info("Entering RECOVER state...")
                self._close_serial()
                time.sleep(3)
                self.state = BridgeState.SEARCH_PORT

def load_config(args):
    config = {
        "port": args.port,
        "baud": args.baud,
        "url": args.url,
        "command_url": args.command_url,
        "bridge_token": args.bridge_token
    }
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                file_cfg = json.load(f)
                # Let file override defaults, but args override file
                for k, v in file_cfg.items():
                    if getattr(args, k, None) is None or getattr(args, k) == parser.get_default(k):
                        config[k] = v
        except Exception as e:
            logger.error(f"Error reading config.json: {e}")
    return config

bridge_instance = None

def signal_handler(sig, frame):
    if bridge_instance:
        bridge_instance.shutdown()
    sys.exit(0)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", help="COM port")
    parser.add_argument("--baud", type=int, default=115200)
    parser.add_argument("--url", default="http://127.0.0.1:8000/api/kiosk/live-vitals")
    parser.add_argument("--command-url", default="http://127.0.0.1:8000/api/kiosk/command")
    parser.add_argument("--bridge-token", dest="bridge_token", default=None,
                         help="Shared secret matching KIOSK_BRIDGE_TOKEN in the Laravel app's .env")
    args = parser.parse_args()
    
    config = load_config(args)
    bridge_instance = HealthKioskBridge(config)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        bridge_instance.run()
    except KeyboardInterrupt:
        bridge_instance.shutdown()
