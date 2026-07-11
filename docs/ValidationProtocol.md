# Validation Protocol

**Document Information**
* **Title**: Health Kiosk Engineering Validation Protocol
* **Version**: 1.0.0
* **Author**: Health Kiosk Engineering Team
* **Project**: Health Kiosk Capstone
* **Firmware Version**: 1.0.0
* **Protocol Version**: 2.0
* **Last Updated**: 2026-07-05
* **Review Status**: Draft

---

## 1. Purpose
This document establishes the formal engineering test plan for the Health Kiosk. It defines the step-by-step procedures required to verify system integration (Phase 8) and clinical/hardware validation (Phase 10) before the system can be considered production-ready.

## 2. Scope
This protocol covers:
* Firmware boot and initialization verification.
* Serial protocol and JSON envelope validation.
* Python Bridge resilience and fault recovery.
* Clinical validation of the four primary sensors (Temperature, Weight, Height, Heart Rate/SpO₂).
* Long-duration system stress testing.

## 3. Test Environment
* **Location**: Controlled indoor laboratory/clinical environment.
* **Ambient Temperature**: 20°C to 24°C (critical for MLX90614 baseline).
* **Lighting**: Standard indoor lighting; avoid direct sunlight on MAX30102.

## 4. Required Equipment
* Calibrated clinical digital thermometer (Reference for MLX90614).
* Certified clinical pulse oximeter (Reference for MAX30102).
* Certified calibration weights: 20kg, 40kg, 60kg, 80kg, 100kg (Reference for HX711).
* Fixed rigid measuring tape or stadiometer (Reference for TF-Luna).
* Host PC running Laravel backend and React frontend.

## 5. Firmware Version
* **Target Version**: 1.0.0 (Frozen Architecture).

## 6. Hardware Configuration
* Arduino Mega 2560 Rev3.
* Sensors mounted in final physical kiosk enclosure to account for structural interference.

## 7. Pre-Test Checklist
- [ ] Arduino Mega flashed with `HealthKioskFirmware.ino`.
- [ ] Sensors wired according to `WiringDiagram.md`.
- [ ] Sensors calibrated according to `CalibrationGuide.md`.
- [ ] Python bridge `config.json` configured.
- [ ] Laravel API endpoints active.

---

## 8. Boot Verification
**Procedure**: Apply power to the Arduino Mega. Open the Serial Monitor (115200 baud).
**Expected Result**:
1. `{"protocol":"2.0","firmware":"1.0.0","type":"info","payload":{"infoType":"BOOT","message":"Kiosk Firmware Starting"}}`
2. `{"protocol":"2.0","firmware":"1.0.0","type":"info","payload":{"infoType":"SELF_TEST","message":"PASSED"}}`

## 9. Sensor Self-Test
**Procedure**: Induced by the boot sequence. If `SELF_TEST` fails, send `GET_DIAGNOSTICS` to isolate the failing I2C/UART bus.
**Expected Result**: All 4 HAL interfaces successfully return `true` on `.initialize()` and `.selfTest()`.

## 10. Communication Verification
**Procedure**: Send `PING\n` via serial terminal.
**Expected Result**: System responds with `PONG` packet within 100ms.

## 11. JSON Protocol Verification
**Procedure**: Issue `START_WEIGHT` and observe the output stream.
**Expected Result**:
* Output is strict JSON.
* Contains `protocol: 2.0`.
* Contains monotonically increasing `sequence`.
* Contains `timestamp`.
* `payload.status` is `SUCCESS`.

## 12. Python Bridge Verification
**Procedure**: Start `python health_kiosk_serial_bridge.py`.
**Expected Result**:
* Logs `[INFO] Auto-detected port: ...`
* Logs `[INFO] Connected to ...`
* Logs `[INFO] Protocol verified. Firmware v1.0.0`

## 13. Laravel Integration
**Procedure**: Issue a measurement command via the UI.
**Expected Result**: Laravel receives the translated payload from the bridge and persists the measurement without throwing 500 errors.

## 14. React Integration
**Procedure**: Complete a full user flow on the frontend.
**Expected Result**: React UI updates in real-time as the bridge posts data to Laravel. No frontend code changes should have been required.

---

## 15. Temperature Validation (MLX90614)
**Procedure**: Test 30 human subjects using both the kiosk and the clinical reference thermometer. Ensure subjects have been indoors for at least 5 minutes prior to testing to allow skin temperature stabilization.
**Metrics to Record**:
* Reference Temp (°C)
* Kiosk Temp (°C)
* Difference (Error)
**Acceptance Criteria**: Mean Error < ±0.3°C.

## 16. Weight Validation (HX711)
**Procedure**: Place calibration weights sequentially (20, 40, 60, 80, 100kg). Repeat the entire sequence 10 times.
**Metrics to Record**:
* Absolute Error at each tier.
* Repeatability (variance across the 10 trials).
* Hysteresis (difference when measuring 60kg ascending vs descending).
**Acceptance Criteria**: Absolute Error < ±0.2kg.

## 17. Height Validation (TF-Luna)
**Procedure**: Place rigid flat targets at exactly 150cm, 160cm, 170cm, 180cm, and 190cm from the floor base.
**Metrics to Record**:
* Absolute Error.
**Acceptance Criteria**: Absolute Error < ±1.0cm.

## 18. Heart Rate Validation (MAX30102)
**Procedure**: Test subjects wearing the reference pulse oximeter on the left index finger while placing the right index finger on the kiosk sensor.
Test states:
1. Resting (seated for 5 mins).
2. Elevated (post light exercise).
**Metrics to Record**: Average difference between devices over a 30-second window.
**Acceptance Criteria**: Difference < ±3 BPM.

## 19. SpO₂ Validation (MAX30102)
**Procedure**: Concurrent with Heart Rate validation.
**Metrics to Record**: SpO₂ bias and precision.
**Acceptance Criteria**: Difference < ±2%. (Note: Absolute SpO₂ validation typically requires arterial blood gas analysis; this is a secondary correlation test).

---

## 20. Stress Testing (24-Hour Continuous)
**Procedure**: Leave the system powered on and the Python bridge running for 24 hours. Issue `START_TEMPERATURE` every 5 minutes automatically via a script.
**Expected Result**:
* 0 Memory Leaks (Bridge RAM stable).
* 0 Python thread crashes.
* 0 MCU watchdog resets.
* 100% of packets received by Laravel.

## 21. Fault Recovery
**Procedure**:
1. **USB Disconnect**: Unplug the Arduino USB during a measurement. Wait 5 seconds. Reconnect.
   * *Expected*: Bridge enters `RECOVER` -> `CONNECTING` -> `READY`.
2. **Laravel Failure**: Stop the Laravel server. Issue a measurement.
   * *Expected*: Bridge worker logs warnings, queues the payload, retries 1s, 2s, 4s, 8s, then drops. Start Laravel; system immediately recovers for next measurement.
3. **Invalid Packet**: Manually inject random bytes into the serial line.
   * *Expected*: Bridge logs a JSON decode error, drops the line, and continues without crashing.

---

## 22. Acceptance Criteria
The system is deemed validated and production-ready ONLY when all tests in sections 15-21 pass according to the specified criteria. Results must be documented in `PerformanceReport.md`.

## 23. Test Log
*(To be filled during execution)*
* **Date**: _______________
* **Tester**: _______________
* **Notes**: _______________

## 24. Test Sign-off
* **Lead Engineer**: _____________________ Date: ________
* **Project Advisor**: _____________________ Date: ________
