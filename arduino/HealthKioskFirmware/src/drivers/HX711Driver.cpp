/**
 * @file HX711Driver.cpp
 * @brief Implementation of HX711Driver.
 */

#include "HX711Driver.h"
#include <Arduino.h>

namespace HealthKiosk {
namespace Drivers {

    HX711Driver::HX711Driver(uint8_t doutPin, uint8_t sckPin) 
        : _doutPin(doutPin), _sckPin(sckPin), _lastError(ErrorCode::OK), _connected(false) {
    }

    void HX711Driver::setError(ErrorCode err) {
        _lastError = err;
    }

    bool HX711Driver::begin() {
        hx.begin(_doutPin, _sckPin);
        _connected = true;
        setError(ErrorCode::OK);
        return true;
    }

    bool HX711Driver::selfTest() {
        unsigned long start = millis();
        
        // Give the HX711 up to 2000ms to stabilize and pull DOUT low
        while (!hx.is_ready()) {
            if (millis() - start > 2000) { 
                _connected = false;
                setError(ErrorCode::SENSOR_TIMEOUT);
                return false;
            }
            delay(10);
        }
        
        long firstRead = hx.read();
        // If it constantly reads maximum positive value, it's disconnected
        if (firstRead == 8388607) {
            _connected = false;
            setError(ErrorCode::SENSOR_DISCONNECTED);
            return false;
        }

        _connected = true;
        setError(ErrorCode::OK);
        return true;
    }

    bool HX711Driver::reset() {
        powerDown();
        delay(10);
        powerUp();
        return begin();
    }

    bool HX711Driver::isConnected() const {
        return _connected;
    }

    bool HX711Driver::readRaw(long& rawValue) {
        if (!hx.is_ready()) {
            setError(ErrorCode::SENSOR_TIMEOUT);
            return false;
        }

        rawValue = hx.read();
        setError(ErrorCode::OK);
        return true;
    }

    void HX711Driver::powerDown() {
        hx.power_down();
    }

    void HX711Driver::powerUp() {
        hx.power_up();
    }

    ErrorCode HX711Driver::lastError() const {
        return _lastError;
    }

    const char* HX711Driver::name() const { return "HX711"; }
    const char* HX711Driver::version() const { return "1.0.0"; }
    bool HX711Driver::supportsSelfTest() const { return true; }

} // namespace Drivers
} // namespace HealthKiosk
