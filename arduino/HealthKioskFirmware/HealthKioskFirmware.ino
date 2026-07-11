/**
 * @file HealthKioskFirmware.ino
 * @brief Main entry point for Health Kiosk Firmware.
 */

#define HARDWARE_TEST_MODE 1

#include "src/config/Version.h"
#include "src/config/Pins.h"
#include "src/hal/HALTemperature.h"
#include "src/hal/HALWeight.h"
#include "src/hal/HALHeight.h"
#include "src/hal/HALHeart.h"
#include "src/modules/TemperatureMeasurement.h"
#include "src/modules/WeightMeasurement.h"
#include "src/modules/HeightMeasurement.h"
#include "src/modules/HeartMeasurement.h"
#include "src/core/MeasurementManager.h"
#include "src/core/StateMachine.h"
#include <Arduino.h>

#if HARDWARE_TEST_MODE
#include <LiquidCrystal_I2C.h>
LiquidCrystal_I2C lcd(0x27, 16, 2);
#endif

using namespace HealthKiosk;

// HAL Instances
HAL::HALTemperature* tempHal;
HAL::HALWeight* weightHal;
HAL::HALHeight* heightHal;
HAL::HALHeart* heartHal;

// Modules
Modules::TemperatureMeasurement* tempMeas;
Modules::WeightMeasurement* weightMeas;
Modules::HeightMeasurement* heightMeas;
Modules::HeartMeasurement* heartMeas;

// Core
Core::MeasurementManager* mm;
Core::StateMachine* sm;

#if HARDWARE_TEST_MODE

void setup() {
    Serial.begin(115200);
    while (!Serial) { delay(10); }

    // Init LCD
    lcd.init();
    lcd.backlight();
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Health Kiosk");
    lcd.setCursor(0, 1);
    lcd.print("Test Mode Ready");

    // Initialize HALs so we can test them directly
    tempHal = new HAL::HALTemperature();
    weightHal = new HAL::HALWeight(Config::Pins::HX711_DOUT_PIN, Config::Pins::HX711_SCK_PIN);
    heightHal = new HAL::HALHeight(&Serial2);
    heartHal = new HAL::HALHeart();

    // Init Modules for algorithm testing
    tempMeas = new Modules::TemperatureMeasurement(tempHal);
    weightMeas = new Modules::WeightMeasurement(weightHal);
    heightMeas = new Modules::HeightMeasurement(heightHal);
    heartMeas = new Modules::HeartMeasurement(heartHal);

    Serial.println("\n==================================");
    Serial.println("    KIOSK HARDWARE TEST MODE      ");
    Serial.println("==================================");
    Serial.println("Press '1' -> Test MLX90614 (Temp)");
    Serial.println("Press '2' -> Test HX711 (Weight)");
    Serial.println("Press '3' -> Test TF-Luna (Height)");
    Serial.println("Press '4' -> Test MAX30102 (Heart)");
    Serial.println("Press '5' -> FULL SEQUENCE (LCD)");
    Serial.println("Press '6' -> MAX30102 RAW WAVEFORM PLOTTER");
    Serial.println("==================================");
}

void loop() {
    if (Serial.available()) {
        char c = Serial.read();
        
        if (c == '1') {
            Serial.println("\n--- Testing MLX90614 (Temp) ---");
            if (tempHal->initialize()) {
                Serial.println("Init: OK");
                if (tempHal->selfTest()) Serial.println("Self Test: OK");
                else Serial.println("Self Test: FAILED");
            } else {
                Serial.println("Init: FAILED");
            }
        }
        else if (c == '2') {
            Serial.println("\n--- Testing HX711 (Weight) ---");
            if (weightHal->initialize()) {
                Serial.println("Init: OK");
                if (weightHal->selfTest()) Serial.println("Self Test: OK");
                else Serial.println("Self Test: FAILED");
            } else {
                Serial.println("Init: FAILED");
            }
        }
        else if (c == '3') {
            Serial.println("\n--- Testing TF-Luna (Height) ---");
            if (heightHal->initialize()) {
                Serial.println("Init: OK");
                if (heightHal->selfTest()) Serial.println("Self Test: OK");
                else Serial.println("Self Test: FAILED");
            } else {
                Serial.println("Init: FAILED");
            }
        }
        else if (c == '4') {
            Serial.println("\n--- MAX30102 CONTINUOUS MEDICAL TEST ---");
            Serial.println("Press 'q' in Serial Monitor to stop.");
            
            lcd.clear();
            lcd.setCursor(0, 0);
            lcd.print("MAX30102 Test...");
            lcd.setCursor(0, 1);
            lcd.print("Put finger on...");
            
            heartHal->initialize();
            
            // Infinite loop to continuously measure and update LCD
            unsigned long lastPrintTime = 0;
            
            heartMeas->start();
            
            while (true) {
                heartMeas->update();
                
                // Exit test if user types 'q'
                if (Serial.available()) {
                    if (Serial.read() == 'q') {
                        Serial.println("Exiting MAX30102 Test.");
                        return; // Break out of test mode
                    }
                }
                
                if (heartMeas->getState() == Modules::MeasureState::COMPLETE || heartMeas->getState() == Modules::MeasureState::ERROR) {
                    Serial.println("\nMeasurement Finished!");
                    break;
                }
                
                // Print LIVE in-progress values every 500ms
                if (millis() - lastPrintTime > 500) {
                    lastPrintTime = millis();
                    auto liveRes = heartMeas->getResult();
                    
                    lcd.clear();
                    lcd.setCursor(0, 0);
                    
                    if (!liveRes.flags.targetDetected) {
                        lcd.print("Place Finger");
                        Serial.println("\n-----------------------------");
                        Serial.println("Finger: NO FINGER");
                    } else {
                        if (liveRes.value > 0 || liveRes.secondaryValue > 0) {
                            lcd.print(" HR:");
                            lcd.print((int)liveRes.value);
                            lcd.print(" Sig:");
                            lcd.print((int)liveRes.confidence);
                            
                            lcd.setCursor(0, 1);
                            lcd.print("SpO2:");
                            lcd.print((int)liveRes.secondaryValue);
                            lcd.print("% ");
                        } else {
                            lcd.print("Measuring...");
                            lcd.setCursor(0, 1);
                            lcd.print("Hold still.");
                        }

                        Serial.println("\n-----------------------------");
                        Serial.print("IR: "); Serial.println(heartMeas->getLatestIR());
                        Serial.print("RED: "); Serial.println(heartMeas->getLatestRed());
                        Serial.println("");
                        Serial.print("HR_RAW: "); Serial.println(heartMeas->getRawHR());
                        Serial.print("HR_VALID: "); Serial.println(heartMeas->isRawHrValid() ? "TRUE" : "FALSE");
                        Serial.println("");
                        Serial.print("SpO2_RAW: "); Serial.println(heartMeas->getRawSpO2());
                        Serial.print("SpO2_VALID: "); Serial.println(heartMeas->isRawSpo2Valid() ? "TRUE" : "FALSE");
                        Serial.println("");
                        Serial.print("HR_DISPLAY: "); Serial.println((int)liveRes.value);
                        Serial.print("SpO2_DISPLAY: "); Serial.println((int)liveRes.secondaryValue);
                        Serial.println("");
                        Serial.print("Signal Strength: "); Serial.print((int)liveRes.confidence); Serial.println("%");
                        Serial.println("Finger: DETECTED");
                    }
                }
                delay(5);
            }
            
            auto finalRes = heartMeas->getResult();
            lcd.clear();
            lcd.setCursor(0, 0);
            lcd.print("FINAL HR: "); lcd.print((int)finalRes.value);
            lcd.setCursor(0, 1);
            lcd.print("FINAL SpO2: "); lcd.print((int)finalRes.secondaryValue);
            
            Serial.print("FINAL RESULT -> HR: "); Serial.print((int)finalRes.value);
            Serial.print(" BPM | SpO2: "); Serial.print((int)finalRes.secondaryValue); Serial.println("%");
            
            delay(3000); // Give user time to read before returning to menu
            }
        else if (c == '5') {
            Serial.println("\n--- RUNNING FULL SENSOR SEQUENCE ---");
            
            // 1. Ready & Countdown
            lcd.clear();
            lcd.setCursor(0, 0);
            lcd.print("Get Ready...");
            delay(2000);
            
            for (int i = 5; i > 0; i--) {
                lcd.clear();
                lcd.setCursor(0, 0);
                lcd.print("Starting in: ");
                lcd.print(i);
                delay(1000);
            }
            
            // 2. Heart Rate Setup
            lcd.clear();
            lcd.setCursor(0, 0);
            lcd.print("Put finger on");
            lcd.setCursor(0, 1);
            lcd.print("Heart Sensor");
            delay(4000); // 4 seconds to place finger
            
            // 3. Heart Rate Measuring (Algorithmic Processing)
            lcd.clear();
            lcd.setCursor(0, 0);
            lcd.print("Measuring Heart.");
            lcd.setCursor(0, 1);
            lcd.print("Please wait...");
            
            heartHal->initialize();
            heartMeas->start();
            
            unsigned long startWait = millis();
            // Wait 12 seconds for the Maxim algorithm to collect samples and stabilize
            while (millis() - startWait < 12000) {
                heartMeas->update();
                delay(10);
            }
            auto hrRes = heartMeas->getResult();
            
            // 4. Weight, Height, Temp Setup
            lcd.clear();
            lcd.setCursor(0, 0);
            lcd.print("Stand on Scale");
            lcd.setCursor(0, 1);
            lcd.print("& under LiDAR");
            delay(5000); // 5 seconds to get into position
            
            // 5. Weight, Height, Temp Measuring
            lcd.clear();
            lcd.setCursor(0, 0);
            lcd.print("Measuring Body..");
            lcd.setCursor(0, 1);
            lcd.print("Hold still...");
            
            tempHal->initialize();
            weightHal->initialize();
            heightHal->initialize();
            
            tempMeas->start();
            weightMeas->start();
            heightMeas->start();
            
            startWait = millis();
            // Wait 5 seconds for scale to settle and LiDAR to average
            while (millis() - startWait < 5000) {
                tempMeas->update();
                weightMeas->update();
                heightMeas->update();
                delay(10);
            }
            
            auto tRes = tempMeas->getResult();
            auto wRes = weightMeas->getResult();
            auto hRes = heightMeas->getResult();
            
            // 6. Display all Results
            lcd.clear();
            lcd.setCursor(0, 0);
            lcd.print("HR:");
            lcd.print((int)hrRes.value);
            lcd.print(" O2:");
            lcd.print((int)hrRes.secondaryValue);
            
            lcd.setCursor(0, 1);
            lcd.print("W:");
            lcd.print(wRes.value, 1);
            lcd.print(" H:");
            lcd.print(hRes.value, 1);
            
            Serial.println("\nFinal Results:");
            Serial.print("HR: "); Serial.println(hrRes.value);
            Serial.print("SpO2: "); Serial.println(hrRes.secondaryValue);
            Serial.print("Temp: "); Serial.println(tRes.value);
            Serial.print("Weight: "); Serial.println(wRes.value);
            Serial.print("Height: "); Serial.println(hRes.value);
            
            delay(6000); // Display for 6 seconds
            
            // Extra screen for Temp since it doesn't fit on 16x2 easily
            lcd.clear();
            lcd.setCursor(0, 0);
            lcd.print("Body Temp:");
            lcd.setCursor(0, 1);
            lcd.print(tRes.value, 1);
            lcd.print(" C");
            
            delay(5000);
            
            // Return to IDLE
            lcd.clear();
            lcd.setCursor(0, 0);
            lcd.print("Health Kiosk");
            lcd.setCursor(0, 1);
            lcd.print("Test Mode Ready");
        }
        else if (c == '6') {
            Serial.println("\n--- MAX30102 RAW WAVEFORM PLOTTER ---");
            Serial.println("Open Arduino Serial Plotter (115200 baud).");
            Serial.println("Send 'q' to stop.");
            
            lcd.clear();
            lcd.setCursor(0, 0);
            lcd.print("Plotter Mode");
            lcd.setCursor(0, 1);
            lcd.print("See PC screen");
            
            heartHal->initialize();
            
            while (true) {
                if (Serial.available()) {
                    if (Serial.read() == 'q') {
                        Serial.println("Exiting Plotter Mode.");
                        return;
                    }
                }
                
                uint32_t red, ir;
                if (heartHal->hasNewSample()) {
                    if (heartHal->acquire(red, ir)) {
                        Serial.print(millis());
                        Serial.print(",");
                        Serial.print(ir);
                        Serial.print(",");
                        Serial.println(red);
                    }
                }
            }
        }
    }
}

#else

// Original Firmware Boot Sequence
void setup() {
    // HAL Instantiation
    tempHal = new HAL::HALTemperature();
    weightHal = new HAL::HALWeight(Config::Pins::HX711_DOUT_PIN, Config::Pins::HX711_SCK_PIN);
    heightHal = new HAL::HALHeight(&Serial2);
    heartHal = new HAL::HALHeart();

    // Module Instantiation
    tempMeas = new Modules::TemperatureMeasurement(tempHal);
    weightMeas = new Modules::WeightMeasurement(weightHal);
    heightMeas = new Modules::HeightMeasurement(heightHal);
    heartMeas = new Modules::HeartMeasurement(heartHal);

    // Core Instantiation
    mm = new Core::MeasurementManager(tempMeas, weightMeas, heightMeas, heartMeas);
    sm = new Core::StateMachine(mm, tempHal, weightHal, heightHal, heartHal);

    sm->begin();
}

void loop() {
    sm->update();
}

#endif
