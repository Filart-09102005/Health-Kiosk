/**
 * @file HALHeight.cpp
 * @brief Implementation of HALHeight.
 */

#include "HALHeight.h"
#include "../config/CalibrationData.h"

namespace HealthKiosk {
namespace HAL {

    HALHeight::HALHeight(HardwareSerial* serialPort) 
        : driver(serialPort), _sensorHeightCm(Config::Calibration::SENSOR_HEIGHT_FROM_FLOOR_CM) {
    }

    bool HALHeight::initialize() {
        return driver.begin();
    }

    bool HALHeight::selfTest() {
        return driver.selfTest();
    }

    bool HALHeight::reset() {
        return driver.reset();
    }

    bool HALHeight::isReady() const {
        return driver.isConnected();
    }

    ErrorCode HALHeight::lastError() const {
        return driver.lastError();
    }

    void HALHeight::setSensorHeight(float heightFromFloor) {
        _sensorHeightCm = heightFromFloor;
    }

    bool HALHeight::acquire(float& heightCm) {
        if (!isReady()) {
            if (!reset()) return false;
        }

        uint16_t dist, strength, temp;
        if (driver.readRaw(dist, strength, temp)) {
            // distance is from sensor to head.
            // person_height = sensor_height - distance_to_head
            float measuredHeight = _sensorHeightCm - static_cast<float>(dist);
            
            // Basic sanity check, negative height usually means interference or nothing under it.
            if (measuredHeight < 0.0f) {
                measuredHeight = 0.0f;
            }
            heightCm = measuredHeight;
            return true;
        }
        return false;
    }

} // namespace HAL
} // namespace HealthKiosk
