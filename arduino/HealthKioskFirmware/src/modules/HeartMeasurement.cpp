/**
 * @file HeartMeasurement.cpp
 */
#include "HeartMeasurement.h"
#include "../config/SensorProfiles.h"
#include "../config/ErrorCodes.h"
#include <Arduino.h>

namespace HealthKiosk {
namespace Modules {

    HeartMeasurement::HeartMeasurement(HAL::HALHeart* hal) 
        : _hal(hal), _state(MeasureState::IDLE), _stableCount(0) {
    }

    void HeartMeasurement::start() {
        _state = MeasureState::INITIALIZE;
        _samplesCollected = 0;
        _stableCount = 0;
        _startTime = millis();
        _rawHR = 0;
        _rawSpO2 = 0;
        _rawHrValid = false;
        _rawSpo2Valid = false;
        _result = Models::MeasurementResult();
        _hrProcessor.reset();
        _spo2Processor.reset();
    }

    void HeartMeasurement::update() {
        if (_state == MeasureState::IDLE || _state == MeasureState::COMPLETE || _state == MeasureState::ERROR) return;

        if (millis() - _startTime > Config::Profiles::HEART_TIMEOUT_MS) {
            _result.error = ErrorCode::SENSOR_TIMEOUT;
            _state = MeasureState::ERROR;
            return;
        }

        switch (_state) {
            case MeasureState::INITIALIZE:
                if (_hal->isReady() || _hal->initialize()) {
                    _state = MeasureState::WAIT_FOR_SENSOR;
                } else {
                    _result.error = _hal->lastError();
                    _state = MeasureState::ERROR;
                }
                break;

            case MeasureState::WAIT_FOR_SENSOR:
                if (_hal->selfTest()) {
                    _state = MeasureState::COLLECT_SAMPLES;
                } else {
                    _result.error = _hal->lastError();
                    _state = MeasureState::ERROR;
                }
                break;

            case MeasureState::COLLECT_SAMPLES:
            case MeasureState::COMPLETE: { // Treat COMPLETE exactly like COLLECT_SAMPLES so validation mode can keep rolling
                uint32_t red, ir;
                while (_hal->hasNewSample()) {
                    if (_hal->acquire(red, ir)) {
                        _redBuffer[_samplesCollected] = red;
                        _irBuffer[_samplesCollected] = ir;
                        
                        _samplesCollected++;

                        if (_samplesCollected >= HEART_BUFFER_SIZE) {
                            _state = MeasureState::FILTER;
                            break;
                        }
                    }
                }
                break;
            }

            case MeasureState::FILTER: {
                // Phase 4: Finger detection
                float avgIR = 0;
                for (int i = 0; i < HEART_BUFFER_SIZE; i++) avgIR += _irBuffer[i];
                avgIR /= HEART_BUFFER_SIZE;

                if (avgIR < 10000.0f) { // Threshold for finger
                    // No finger detected. Reset buffers, counters, and invalidate data.
                    _samplesCollected = 0;
                    _stableCount = 0;
                    _result.flags.targetDetected = false;
                    _result.flags.passedValidation = false;
                    _result.confidence = 0.0f;
                    _result.value = 0.0f;          // Invalidate BPM
                    _result.secondaryValue = 0.0f; // Invalidate SpO2
                    _hrProcessor.reset();
                    _spo2Processor.reset();
                    _state = MeasureState::COLLECT_SAMPLES;
                    break;
                }
                
                _result.flags.targetDetected = true;

                // Simple Motion Rejection & Diagnostic SQI
                // Calculate variance of IR
                float varianceIR = 0;
                for (int i = 0; i < HEART_BUFFER_SIZE; i++) {
                    varianceIR += (_irBuffer[i] - avgIR) * (_irBuffer[i] - avgIR);
                }
                varianceIR /= HEART_BUFFER_SIZE;
                
                // Diagnostic SQI: Temporarily normalized to typical healthy IR amplitude (approx 100k - 150k)
                float sqi = (avgIR / 150000.0f) * 100.0f;
                if (sqi < 0) sqi = 0;
                if (sqi > 100) sqi = 100;
                _result.confidence = sqi; // Diagnostic only!

                if (varianceIR > 5000000.0f) { // Arbitrary high variance threshold indicating severe motion
                    // Motion corrupted this window, discard and retry without changing underlying algorithm
                    _samplesCollected = 0;
                    _state = MeasureState::COLLECT_SAMPLES;
                    break;
                }

                int32_t spo2;
                int8_t spo2Valid;
                int32_t heartRate;
                int8_t hrValid;

                // Call the manufacturer reference algorithm
                maxim_heart_rate_and_oxygen_saturation(
                    _irBuffer, HEART_BUFFER_SIZE, 
                    _redBuffer, &spo2, &spo2Valid, 
                    &heartRate, &hrValid
                );
                
                _rawHR = heartRate;
                _rawSpO2 = spo2;
                _rawHrValid = hrValid;
                _rawSpo2Valid = spo2Valid;

                // --- TEMPORARY DIAGNOSTIC LOGGING ---
                uint32_t minIR = 0xFFFFFFFF;
                uint32_t maxIR = 0;
                uint32_t minRED = 0xFFFFFFFF;
                uint32_t maxRED = 0;
                float avgRED = 0;
                
                for (int i = 0; i < HEART_BUFFER_SIZE; i++) {
                    if (_irBuffer[i] < minIR) minIR = _irBuffer[i];
                    if (_irBuffer[i] > maxIR) maxIR = _irBuffer[i];
                    
                    if (_redBuffer[i] < minRED) minRED = _redBuffer[i];
                    if (_redBuffer[i] > maxRED) maxRED = _redBuffer[i];
                    
                    avgRED += _redBuffer[i];
                }
                avgRED /= HEART_BUFFER_SIZE;
                
                float varianceRED = 0;
                for (int i = 0; i < HEART_BUFFER_SIZE; i++) {
                    varianceRED += (_redBuffer[i] - avgRED) * (_redBuffer[i] - avgRED);
                }
                varianceRED /= HEART_BUFFER_SIZE;
                
                float stdDevIR = sqrt(varianceIR);
                float stdDevRED = sqrt(varianceRED);
                
                Serial.println("\n--- ALGORITHM WINDOW CONFIDENCE ---");
                Serial.print("heartRate: "); Serial.println(heartRate);
                Serial.print("heartRateValid: "); Serial.println(hrValid);
                Serial.print("spo2: "); Serial.println(spo2);
                Serial.print("spo2Valid: "); Serial.println(spo2Valid);
                
                Serial.println("\n-- IR STATISTICS --");
                Serial.print("Mean IR: "); Serial.println(avgIR);
                Serial.print("Min IR: "); Serial.println(minIR);
                Serial.print("Max IR: "); Serial.println(maxIR);
                Serial.print("Peak-to-peak IR: "); Serial.println(maxIR - minIR);
                Serial.print("StdDev IR: "); Serial.println(stdDevIR);
                
                Serial.println("\n-- RED STATISTICS --");
                Serial.print("Mean RED: "); Serial.println(avgRED);
                Serial.print("Min RED: "); Serial.println(minRED);
                Serial.print("Max RED: "); Serial.println(maxRED);
                Serial.print("Peak-to-peak RED: "); Serial.println(maxRED - minRED);
                Serial.print("StdDev RED: "); Serial.println(stdDevRED);

                Serial.println("\n--- FIRST 10 SAMPLES IN THIS WINDOW ---");
                for (int i = 0; i < 10; i++) {
                    Serial.print("i="); Serial.print(i);
                    Serial.print(" IR="); Serial.print(_irBuffer[i]);
                    Serial.print(" RED="); Serial.println(_redBuffer[i]);
                }
                Serial.println("-----------------------------------");
                // ------------------------------------

                // Phase 5: Result validation & Stability Averaging
                if (hrValid && spo2Valid && spo2 > 50 && spo2 <= 100 && heartRate > 20 && heartRate < 255) {
                    float emaBefore = _hrProcessor.getAverageHR();
                    
                    // Feed valid SpO2 and HR to post-algorithm processor to stabilize display over 8-15s
                    _spo2Processor.processSample(spo2);
                    _hrProcessor.processSample(heartRate, millis());
                    
                    _result.value = _hrProcessor.getAverageHR(); // Uses the smoothed Maxim HR
                    _result.secondaryValue = _spo2Processor.getAverageSpO2(); // Smoothed SpO2
                    
                    static int windowCount = 0;
                    windowCount++;
                    
                    Serial.println("\n--- EMA PIPELINE DIAGNOSTIC ---");
                    Serial.print("Elapsed Time (ms): "); Serial.println(millis() - _startTime);
                    Serial.print("Window number: "); Serial.println(windowCount);
                    Serial.print("stableCount: "); Serial.println(_stableCount);
                    Serial.print("EMA before: "); Serial.println(emaBefore);
                    Serial.print("Raw HR: "); Serial.println(heartRate);
                    Serial.print("EMA after: "); Serial.println(_result.value);
                    
                    if (_result.value > 0 && _result.secondaryValue > 0) {
                        _result.flags.signalStable = true;
                        _result.flags.enoughSamples = true;
                        _result.flags.passedValidation = true;
                        
                        _stableCount++;
                        if (_stableCount >= 4) { // Target reached, safe to lock in if we wanted
                            _result.measurementTime = millis() - _startTime;
                            _result.timestamp = millis();
                            _state = MeasureState::COMPLETE;
                            Serial.print("FINAL_RESULT_HR: "); Serial.println(_result.value);
                            windowCount = 0; // Reset for next session
                        }
                    }
                    Serial.println("-------------------------------");
                } else {
                    _stableCount = 0; // Reset consecutive valid count
                    static int windowCountBad = 0;
                    windowCountBad++;
                    Serial.println("\n--- EMA PIPELINE DIAGNOSTIC (INVALID WINDOW) ---");
                    Serial.print("Window number (Invalid): "); Serial.println(windowCountBad);
                    Serial.print("heartRate (Raw): "); Serial.println(heartRate);
                    Serial.print("HR_DISPLAY (EMA): "); Serial.println(_hrProcessor.getAverageHR());
                    Serial.println("------------------------------------------------");
                    _result.flags.passedValidation = false;
                }

                // Phase 6: Rolling buffer - shift 20 oldest out (as requested: shift 20, read 20)
                for (int i = 20; i < HEART_BUFFER_SIZE; i++) {
                    _irBuffer[i - 20] = _irBuffer[i];
                    _redBuffer[i - 20] = _redBuffer[i];
                }
                
                // We now have 80 samples, need 20 more
                _samplesCollected = 80;
                _state = MeasureState::COLLECT_SAMPLES;
                
                break;
            }

            default:
                break;
        }
    }

    MeasureState HeartMeasurement::getState() const {
        return _state;
    }

    Models::MeasurementResult HeartMeasurement::getResult() const {
        return _result;
    }

} // namespace Modules
} // namespace HealthKiosk
