/**
 * @file HALHeart.cpp
 * @brief Implementation of HALHeart.
 */

#include "HALHeart.h"

namespace HealthKiosk {
namespace HAL {

    HALHeart::HALHeart() {
    }

    bool HALHeart::initialize() {
        // Pass the explicit configuration as required by architecture
        return driver.begin(60, 4, 2, 100, 411, 4096);
    }

    bool HALHeart::selfTest() {
        return driver.selfTest();
    }

    bool HALHeart::reset() {
        return driver.reset();
    }

    bool HALHeart::isReady() const {
        return driver.isConnected();
    }

    ErrorCode HALHeart::lastError() const {
        return driver.lastError();
    }

    bool HALHeart::hasNewSample() {
        return driver.check();
    }

    bool HALHeart::acquire(uint32_t& red, uint32_t& ir) {
        if (!isReady()) {
            if (!reset()) return false;
        }

        return driver.readRaw(red, ir);
    }

} // namespace HAL
} // namespace HealthKiosk
