import argparse
import re
import time

import requests
import serial
from serial.tools import list_ports

BRIDGE_VERSION = "2026-06-06-command-v1"
RESULT_OXIMETER = re.compile(r"RESULT:OXIMETER:(\d+),(\d+)")
LIVE_OXIMETER = re.compile(r"LIVE:OXIMETER:([^,]+),([^,]+)")
RESULT_WEIGHT = re.compile(r"RESULT:WEIGHT:(-?\d+(?:\.\d+)?)")
LIVE_WEIGHT = re.compile(r"LIVE:WEIGHT:(-?\d+(?:\.\d+)?)")
MODE_PATTERN = re.compile(r"MODE:([A-Z_]+)")
DEBUG_IR = re.compile(r"DEBUG:IR:(\d+)")


def parse_serial_line(line):
    line = line.strip()

    if line == "READY":
        return {"reset": True, "mode": "IDLE"}

    if line == "DONE":
        return {"mode": "IDLE"}

    mode_match = MODE_PATTERN.search(line)
    if mode_match:
        mode = mode_match.group(1)
        payload = {"mode": mode}
        return payload

    debug_ir = DEBUG_IR.search(line)
    if debug_ir:
        return {
            "debug_ir": int(debug_ir.group(1)),
            "ready": False,
            "mode": "OXIMETER",
        }

    result_oximeter = RESULT_OXIMETER.search(line)
    if result_oximeter:
        return {
            "heart_rate": int(result_oximeter.group(1)),
            "spo2": int(result_oximeter.group(2)),
            "ready": True,
            "mode": "OXIMETER",
        }

    live_oximeter = LIVE_OXIMETER.search(line)
    if live_oximeter:
        payload = {"ready": False, "mode": "OXIMETER"}
        bpm_raw = live_oximeter.group(1)
        spo2_raw = live_oximeter.group(2)
        bpm = parse_number(bpm_raw)
        spo2 = parse_number(spo2_raw)
        if bpm is not None:
            payload["heart_rate"] = round(bpm)
        if spo2 is not None:
            payload["spo2"] = round(spo2)
        if bpm is None or spo2 is None:
            payload["status"] = normalize_status(bpm_raw, spo2_raw)
            payload["heart_rate"] = None
            payload["spo2"] = None
        return payload if len(payload) > 2 else {}

    result_weight = RESULT_WEIGHT.search(line)
    if result_weight:
        return {
            "weight": round(float(result_weight.group(1)), 2),
            "ready": True,
            "mode": "WEIGHT",
        }

    live_weight = LIVE_WEIGHT.search(line)
    if live_weight:
        return {
            "weight": round(float(live_weight.group(1)), 2),
            "ready": False,
            "mode": "WEIGHT",
        }

    if line.startswith("ERROR:"):
        return {"reset": True, "mode": "IDLE"}

    return {}


def parse_number(value):
    try:
        return float(value)
    except ValueError:
        return None


def normalize_status(primary, secondary):
    status = f"{primary}_{secondary}".upper().replace("...", "").replace(" ", "_")
    status = re.sub(r"[^A-Z0-9_]+", "_", status)
    status = re.sub(r"_+", "_", status).strip("_")
    return status or "CALCULATING"


def post_json(url, payload, timeout=8):
    response = requests.post(url, json=payload, timeout=timeout)
    response.raise_for_status()
    return response.json() if response.content else {}


def get_json(url, timeout=3):
    response = requests.get(url, timeout=timeout, headers={"Cache-Control": "no-cache"})
    response.raise_for_status()
    return response.json()


def main():
    parser = argparse.ArgumentParser(description="Health Kiosk Arduino serial-to-Laravel bridge")
    parser.add_argument("--port", required=False, help="Arduino serial port, for example COM4")
    parser.add_argument("--baud", type=int, default=115200, help="Serial baud rate")
    parser.add_argument("--url", default="http://127.0.0.1:8000/api/kiosk/live-vitals", help="Laravel live readings endpoint")
    parser.add_argument("--command-url", default="http://127.0.0.1:8000/api/kiosk/command", help="Laravel pending command endpoint")
    parser.add_argument("--list-ports", action="store_true", help="Show detected serial ports and exit")
    args = parser.parse_args()

    if args.list_ports:
        ports = list(list_ports.comports())
        if not ports:
            print("No serial ports detected.")
            return
        for port in ports:
            print(f"{port.device} - {port.description}")
        return

    if not args.port:
        print("Missing --port. Run with --list-ports to find the Arduino COM port.")
        return

    print(f"Listening on {args.port} at {args.baud} baud")
    print(f"Posting live readings to {args.url}")
    print(f"Polling commands from {args.command_url}")
    print(f"Bridge version: {BRIDGE_VERSION}")

    try:
        arduino = serial.Serial(args.port, args.baud, timeout=0.1)
    except serial.SerialException as error:
        print(f"Could not open {args.port}: {error}")
        print("Close Arduino Serial Monitor/Plotter or any app using the port.")
        return

    last_command_id = None
    last_command_poll = 0
    last_posted_line = None

    def should_post_line(line):
        nonlocal last_posted_line
        if line == last_posted_line:
            return False
        last_posted_line = line
        return True

    with arduino:
        time.sleep(2)
        arduino.reset_input_buffer()

        while True:
            now = time.time()

            if now - last_command_poll >= 1.0:
                last_command_poll = now
                try:
                    command_payload = get_json(args.command_url)
                    command = command_payload.get("command")
                    command_id = command_payload.get("id")
                    if command and command_id != last_command_id:
                        if command.startswith("START_") or command == "STOP":
                            try:
                                post_json(args.url, {"reset": True, "mode": "IDLE"}, timeout=3)
                            except requests.RequestException as error:
                                print(f"Reset before command failed: {error}")
                        arduino.write(f"{command}\n".encode("utf-8"))
                        arduino.flush()
                        last_command_id = command_id
                        print(f"Sent command: {command}")
                except requests.RequestException as error:
                    print(f"Command poll failed: {error}")

            raw_line = arduino.readline().decode("utf-8", errors="ignore").strip()
            if not raw_line:
                continue

            print(raw_line)
            payload = parse_serial_line(raw_line)
            if not payload:
                continue

            if not should_post_line(raw_line):
                continue

            try:
                post_json(args.url, payload)
                print(f"Posted: {payload}")
            except requests.RequestException as error:
                print(f"Post failed: {error}")


if __name__ == "__main__":
    main()
