# Calibration Guide

**Document Information**
* **Title**: Health Kiosk Sensor Calibration Guide
* **Version**: 1.0.0
* **Author**: Health Kiosk Engineering Team
* **Project**: Health Kiosk Capstone
* **Firmware Version**: 1.0.0
* **Last Updated**: 2026-07-05
* **Review Status**: Draft

---

## 1. Overview
Proper physical calibration is required to translate raw sensor phenomena into clinically useful data. This document outlines the physical calibration procedures required during kiosk deployment.

> [!IMPORTANT]
> The Arduino firmware applies basic linear offsets and scaling. Do not attempt to calibrate sensors by altering the C++ firmware logic. Update the configuration constants in `config/SensorProfiles.h` instead.

---

## 2. MLX90614 (Temperature)

**Emissivity Assumptions**
The sensor is factory calibrated for an emissivity of 1.0. Human skin has an emissivity of ~0.98. The firmware or breakout board library accounts for this. 

**Ambient Stabilization**
* **Rule**: The MLX90614 uses its internal temperature (Ambient) to compensate the object temperature reading.
* **Procedure**: After powering the kiosk on, allow **15 minutes** for the thermal environment inside the kiosk enclosure to stabilize before taking reference measurements.

**Measurement Distance Calibration**
* The MLX90614 has a Field of View (FOV). For the standard version (90° FOV), the sensor measures a large area.
* **Procedure**: Physically mount the sensor so the user's forehead is exactly **2 to 5 cm** away. Using a reference thermometer, calculate the mean error. Apply this offset linearly if a constant bias exists.

---

## 3. HX711 (Weight)

**Zero Calibration (Tare)**
* **Procedure**: Ensure nothing is on the scale base. Send the firmware command to read the raw ADC value. This value becomes the zero-point offset.

**Span Calibration (Scale Factor)**
* **Procedure**: 
  1. Tare the scale.
  2. Place a known, certified reference weight (e.g., 40.0 kg) dead center on the scale.
  3. Read the raw ADC value.
  4. Calculate the Scale Factor: `ScaleFactor = (RawValue - ZeroOffset) / ReferenceWeight`.
* Update this scale factor in the initialization phase of the HX711 driver.

---

## 4. TF-Luna (Height)

**Installation Height**
* The TF-Luna measures distance (Time of Flight). To calculate human height, it must be mounted pointing downwards from a known fixed height.
* **Procedure**: 
  1. Measure the exact physical distance from the scale base to the sensor lens using a tape measure (e.g., `TOTAL_HEIGHT = 210.0 cm`).
  2. The firmware calculates: `HumanHeight = TOTAL_HEIGHT - SensorReading`.

**Offset Correction**
* **Procedure**: Place a flat board at exactly 100cm from the floor. Observe the height reading. If the reading is 102cm, the sensor has a +2cm bias due to lens cover refraction or acoustic mounting interference. Subtract 2cm from `TOTAL_HEIGHT`.

---

## 5. MAX30102 (Heart Rate & SpO₂)

**Ambient Light Reduction**
* **Procedure**: The MAX30102 photodetector is highly sensitive to ambient infrared (sunlight, halogen bulbs). Ensure the physical finger receptacle shields the sensor from direct external light.

**Warm-up Period**
* The LEDs require thermal stabilization. Do not measure immediately on cold boot. The `WAIT_FOR_SENSOR` state provides a 2-second buffer.

**Finger Placement**
* Too much pressure restricts blood flow (blanching), destroying the AC pulsatile signal.
* Too little pressure allows ambient light leakage.
* **Procedure**: Instruct users via the UI to place their finger *lightly* on the glass. The firmware's internal `targetDetected` proxy ensures the DC level is high enough before commencing the `STABILITY_CHECK`.
