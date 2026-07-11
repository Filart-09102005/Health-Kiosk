# Serial Protocol Specification

**Document Information**
* **Title**: Health Kiosk Serial Protocol Specification
* **Version**: 2.0
* **Author**: Health Kiosk Engineering Team
* **Project**: Health Kiosk Capstone
* **Firmware Version**: 1.0.0
* **Protocol Version**: 2.0
* **Last Updated**: 2026-07-05
* **Review Status**: Draft

---

## 1. Overview
The Arduino Mega communicates with the Python Bridge via UART (115200 baud). All incoming commands are plaintext ASCII. All outgoing responses are strictly formatted JSON envelopes.

## 2. Incoming Commands (Python → Arduino)
Commands must be terminated with a newline character (`\n`).

| Command | Action |
| :--- | :--- |
| `PING` | Requests a heartbeat response. |
| `GET_VERSION` | Requests firmware and protocol version info. |
| `GET_DIAGNOSTICS` | Requests system health and uptime data. |
| `START_TEMPERATURE` | Initiates the MLX90614 measurement state machine. |
| `START_WEIGHT` | Initiates the HX711 measurement state machine. |
| `START_HEIGHT` | Initiates the TF-Luna measurement state machine. |
| `START_HEART` | Initiates the MAX30102 measurement state machine. |

## 3. Outgoing JSON Envelope (Arduino → Python)

Every packet emitted by the Arduino conforms to this root schema:

```json
{
  "protocol": "2.0",
  "firmware": "1.0.0",
  "type": "<string: measurement | error | info>",
  "timestamp": 123456, 
  "sequence": 151,
  "payload": { ... }
}
```

* **protocol**: Must exactly match `"2.0"`.
* **timestamp**: Arduino uptime in milliseconds (`millis()`).
* **sequence**: Monotonically increasing unsigned long. Used for duplicate/drop detection.

---

## 4. Payload Schemas

### 4.1 Type: "measurement" (Success)
Emitted when a sensor state machine completes validation.

```json
{
  "sensor": "HEART",
  "status": "SUCCESS",
  "value": 85.0,
  "secondaryValue": 98.2,
  "confidence": 85.0,
  "sampleCount": 450,
  "measurementTimeMs": 4000,
  "flags": {
    "signalStable": true,
    "enoughSamples": true,
    "targetDetected": true,
    "motionDetected": false,
    "passedValidation": true
  }
}
```
* **sensor**: `TEMPERATURE`, `WEIGHT`, `HEIGHT`, or `HEART`.
* **value**: The primary calibrated reading.
* **secondaryValue**: Exists only for `HEART` (contains SpO₂).

### 4.2 Type: "measurement" (Error)
Emitted if a measurement times out, fails stability checks, or detects hardware faults.

```json
{
  "sensor": "WEIGHT",
  "status": "ERROR",
  "errorCode": 2
}
```

### 4.3 Type: "info"
Emitted for boot events, heartbeats, and diagnostics.

```json
{
  "infoType": "PONG",
  "message": "Alive"
}
```

### 4.4 Type: "error"
Emitted for systemic failures (e.g. attempting to start a measurement while busy).

```json
{
  "errorType": "BUSY",
  "message": "Measurement in progress"
}
```

---

## 5. Recovery Behavior
If the Arduino receives an unknown command, it ignores it silently. If it receives a `START_*` command while `MeasurementManager::isBusy()` is true, it rejects the command and emits a `BUSY` error packet. The Python bridge is responsible for retrying or altering state.
