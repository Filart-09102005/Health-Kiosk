# Compatibility Matrix

**Document Information**
* **Title**: Health Kiosk Compatibility Matrix
* **Version**: 1.0.0
* **Author**: Health Kiosk Engineering Team
* **Project**: Health Kiosk Capstone
* **Firmware Version**: 1.0.0
* **Protocol Version**: 2.0
* **Last Updated**: 2026-07-05
* **Review Status**: Approved / Frozen

---

## 1. Overview
This document records the exact hardware and software versions used during the Phase 8 and Phase 10 validation stages. Any deviation from this matrix in the future may require partial or full re-validation of the system.

## 2. Hardware Matrix

| Component | Version / Specification | Status |
| :--- | :--- | :--- |
| **Microcontroller** | Arduino Mega 2560 Rev3 | Frozen |
| **Temperature Sensor** | MLX90614 (Standard 90° FOV) | Frozen |
| **Weight Sensor** | HX711 + 4x 50kg Load Cells | Frozen |
| **Height Sensor** | Benewake TF-Luna (LiDAR) | Frozen |
| **Heart/SpO₂ Sensor** | SparkFun MAX30102 Breakout | Frozen |
| **Bridge Host PC** | x86_64 Architecture | Flexible |
| **USB Serial Interface** | CH340 / ATmega16U2 | Flexible |

## 3. Firmware Matrix

| Component | Version | Status |
| :--- | :--- | :--- |
| **Health Kiosk Firmware** | `1.0.0` | Frozen |
| **Communication Protocol**| `2.0` | Frozen |
| **Arduino IDE / Core** | AVR Core 1.8.6+ | Frozen |
| **C++ Standard** | C++11 (Arduino Default) | Frozen |

## 4. Vendor Library Dependencies

| Library | Version | Required By |
| :--- | :--- | :--- |
| **ArduinoJson** | `7.x` | `JsonSerializer.cpp` |
| **Adafruit MLX90614** | `2.1.5` (or tested equivalent) | `HALTemperature.cpp` |
| **SparkFun MAX3010x** | `1.1.2` (or tested equivalent) | `HALHeart.cpp` |
| **HX711 (bogde)** | `0.7.5` (or tested equivalent) | `HALWeight.cpp` |
| **TF-Luna Driver** | Custom UART implementation | `HALHeight.cpp` |

## 5. Middleware & Backend Software

| Component | Version | Description |
| :--- | :--- | :--- |
| **Python** | `>= 3.8` | Required for `health_kiosk_serial_bridge.py` |
| **PySerial** | `>= 3.5` | Serial communication |
| **Requests** | `>= 2.25` | HTTP POST requests to Laravel |
| **Laravel Backend** | Project Native | Receives Kiosk payload |
| **React Frontend** | Project Native | UI Layer |
