/**
 * @file HealthKioskFirmware.ino
 * @brief Finalized production entry point: TEMPERATURE (MLX90614) and HEIGHT
 *        (TF-Luna) only, speaking the full JSON serial protocol the web app
 *        and scripts/health_kiosk_serial_bridge.py already expect.
 *
 * WEIGHT (HX711) and HEART RATE/SpO2 (MAX30102) are intentionally not wired:
 * the weight HAL slot below is passed as nullptr, so the state machine's
 * existing self-test marks WEIGHT permanently unavailable and refuses any
 * START_WEIGHT command with a clean "SENSOR_NOT_DETECTED" error instead of
 * touching any hardware — no changes to StateMachine/MeasurementManager were
 * needed. Heart Rate/SpO2 was never part of this state machine.
 *
 * Wiring:
 *   TF-Luna  : 5V, GND, TX -> Mega RX1 (19), RX -> Mega TX1 (18)
 *   MLX90614 : 5V/3.3V, GND, SDA -> Pin 20, SCL -> Pin 21
 *
 * To run this as a live feed into the web app:
 *   1. Upload this sketch to the Mega.
 *   2. Run scripts/health_kiosk_serial_bridge.py on the machine the Mega is
 *      plugged into (it auto-detects the COM port, or pass --port COMx).
 *   3. The bridge posts readings to /api/kiosk/live-vitals and polls
 *      /api/kiosk/command for START_TEMPERATURE / START_HEIGHT requests
 *      coming from the kiosk UI.
 */

#include "src/config/Version.h"
#include "src/config/Pins.h"
#include "src/hal/HALTemperature.h"
#include "src/hal/HALHeight.h"
#include "src/modules/TemperatureMeasurement.h"
#include "src/modules/HeightMeasurement.h"
#include "src/logic/MeasurementManager.h"
#include "src/logic/StateMachine.h"
#include <Arduino.h>

using namespace HealthKiosk;

// HAL Instances — WEIGHT intentionally omitted (nullptr, see header comment).
HAL::HALTemperature* tempHal;
HAL::IHardwareModule* weightHal = nullptr;
HAL::HALHeight* heightHal;

// Modules
Modules::TemperatureMeasurement* tempMeas;
Modules::WeightMeasurement* weightMeas;
Modules::HeightMeasurement* heightMeas;

// Core
Core::MeasurementManager* mm;
Core::StateMachine* sm;

void setup() {
    tempHal = new HAL::HALTemperature();
    heightHal = new HAL::HALHeight(&Serial1);

    tempMeas = new Modules::TemperatureMeasurement(tempHal);
    weightMeas = new Modules::WeightMeasurement(nullptr);
    heightMeas = new Modules::HeightMeasurement(heightHal);

    mm = new Core::MeasurementManager(tempMeas, weightMeas, heightMeas);
    sm = new Core::StateMachine(mm, tempHal, weightHal, heightHal);

    sm->begin();
}

void loop() {
    sm->update();
}
