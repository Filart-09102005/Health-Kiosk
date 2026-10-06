/**
 * @file HALWeight.cpp
 * @brief Implementation of HALWeight.
 */

#include "HALWeight.h"
#include "../config/CalibrationData.h"

namespace HealthKiosk {
namespace HAL {

    HALWeight::HALWeight(uint8_t doutPin, uint8_t sckPin) 
        : driver(doutPin, sckPin), 
          _scaleFactor(Config::Calibration::DEFAULT_WEIGHT_CALIBRATION_FACTOR), 
          _offset(Config::Calibration::DEFAULT_WEIGHT_OFFSET) {
    }

    bool HALWeight::initialize() {
        return driver.begin();
    }

    bool HALWeight::selfTest() {
        return driver.selfTest();
    }

    bool HALWeight::reset() {
        return driver.reset();
    }

    bool HALWeight::isReady() const {
        return driver.isConnected();
    }

    ErrorCode HALWeight::lastError() const {
        return driver.lastError();
    }

    void HALWeight::setCalibration(float scale, long offset) {
        _scaleFactor = scale;
        _offset = offset;
    }

    bool HALWeight::acquire(float& weightKg) {
        if (!isReady()) {
            if (!reset()) return false;
        }

        long rawValue = 0;
        if (driver.readRaw(rawValue)) {
            // Convert to Kg: (raw - offset) / scale
            // To prevent divide by zero:
            if (_scaleFactor == 0.0f) _scaleFactor = 1.0f;
            
            weightKg = static_cast<float>(rawValue - _offset) / _scaleFactor;
            return true;
        }
        return false;
    }

    void HALWeight::tare() {
        long rawValue = 0;
        long sum = 0;
        int count = 0;
        
        unsigned long start = millis();
        // Wait 5 seconds to get a stable zero average
        while (millis() - start < 5000) {
            if (driver.readRaw(rawValue)) {
                sum += rawValue;
                count++;
            }
            delay(10);
        }
        
        if (count > 0) {
            _offset = sum / count;
        }
    }

} // namespace HAL
} // namespace HealthKiosk
