/**
 * @file MAX30102Driver.cpp
 * @brief Implementation of MAX30102Driver.
 */

#include "MAX30102Driver.h"
#include <Wire.h>

namespace HealthKiosk {
namespace Drivers {

    MAX30102Driver::MAX30102Driver() : _lastError(ErrorCode::OK), _connected(false) {
    }

    void MAX30102Driver::setError(ErrorCode err) {
        _lastError = err;
    }

    bool MAX30102Driver::begin(uint8_t ledBrightness, uint8_t sampleAverage, uint8_t ledMode, int sampleRate, int pulseWidth, int adcRange) {
        // Use I2C_SPEED_STANDARD (100kHz) instead of FAST (400kHz) to prevent bus crashes 
        // when sharing long wires with the MLX90614 on a breadboard.
        if (particleSensor.begin(Wire, I2C_SPEED_STANDARD)) {
            particleSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange);
            
            _connected = true;
            setError(ErrorCode::OK);
            return true;
        }
        
        _connected = false;
        setError(ErrorCode::SENSOR_DISCONNECTED);
        return false;
    }

    bool MAX30102Driver::selfTest() {
        if (!begin()) return false;
        
        // Read part ID
        uint8_t revId = particleSensor.getRevisionID();
        if (revId == 0x00 || revId == 0xFF) {
            setError(ErrorCode::SENSOR_DISCONNECTED);
            return false;
        }
        
        setError(ErrorCode::OK);
        return true;
    }

    bool MAX30102Driver::reset() {
        particleSensor.softReset();
        delay(100);
        return begin();
    }

    bool MAX30102Driver::isConnected() const {
        return _connected;
    }

    bool MAX30102Driver::check() {
        if (!_connected) return false;
        particleSensor.check(); // Polls the sensor
        return particleSensor.available(); // Returns true if there is new data in the FIFO
    }

    bool MAX30102Driver::readRaw(uint32_t& red, uint32_t& ir) {
        if (!_connected) {
            setError(ErrorCode::SENSOR_DISCONNECTED);
            return false;
        }

        if (particleSensor.available()) {
            red = particleSensor.getFIFORed();
            ir = particleSensor.getFIFOIR();
            particleSensor.nextSample(); // Advance FIFO tail
            
            setError(ErrorCode::OK);
            return true;
        }
        
        setError(ErrorCode::SENSOR_TIMEOUT);
        return false;
    }

    ErrorCode MAX30102Driver::lastError() const {
        return _lastError;
    }

    const char* MAX30102Driver::name() const { return "MAX30102"; }
    const char* MAX30102Driver::version() const { return "1.0.0"; }
    bool MAX30102Driver::supportsSelfTest() const { return true; }

} // namespace Drivers
} // namespace HealthKiosk
