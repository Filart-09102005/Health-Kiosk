/**
 * @file HALTemperature.cpp
 * @brief Implementation of HALTemperature.
 */

#include "HALTemperature.h"

namespace HealthKiosk {
namespace HAL {

    HALTemperature::HALTemperature() {
    }

    bool HALTemperature::initialize() {
        return driver.begin();
    }

    bool HALTemperature::selfTest() {
        return driver.selfTest();
    }

    bool HALTemperature::reset() {
        return driver.reset();
    }

    bool HALTemperature::isReady() const {
        return driver.isConnected();
    }

    ErrorCode HALTemperature::lastError() const {
        return driver.lastError();
    }

    bool HALTemperature::acquire(float& objectTempC, float& ambientTempC) {
        if (!isReady()) {
            // Attempt auto-recovery
            if (!reset()) return false;
        }

        // The MLX returns Celsius directly. If we needed Fahrenheit or calibration, we do it here.
        return driver.readRaw(objectTempC, ambientTempC);
    }

} // namespace HAL
} // namespace HealthKiosk
