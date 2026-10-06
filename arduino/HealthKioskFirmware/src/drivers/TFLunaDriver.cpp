/**
 * @file TFLunaDriver.cpp
 * @brief Implementation of TFLunaDriver over custom UART parsing.
 */

#include "TFLunaDriver.h"
#include <Arduino.h>

namespace HealthKiosk {
namespace Drivers {

    TFLunaDriver::TFLunaDriver(HardwareSerial* serialPort) 
        : _serial(serialPort), _lastError(ErrorCode::OK), _connected(false) {
    }

    void TFLunaDriver::setError(ErrorCode err) {
        _lastError = err;
    }

    bool TFLunaDriver::begin(uint32_t baudRate) {
        if (_serial) {
            _serial->begin(baudRate);
            _connected = true;
            setError(ErrorCode::OK);
            return true;
        }
        setError(ErrorCode::SENSOR_DISCONNECTED);
        return false;
    }

    bool TFLunaDriver::selfTest() {
        if (!_connected) return false;
        
        // Flush any stale data accumulated in the UART buffer while 
        // other slower sensors (like HX711) were blocking the boot thread.
        if (_serial) {
            while (_serial->available()) {
                _serial->read();
            }
        }
        
        uint16_t dist, strength, temp;
        unsigned long start = millis();
        // Give it up to 2500ms to produce a valid, fresh frame — the TF-Luna
        // can take over a second to start streaming clean frames right after
        // power-up/Serial.begin(), and 1000ms was cutting that too close.
        while (millis() - start < 2500) {
            if (readRaw(dist, strength, temp)) {
                // Remove the strict signal strength requirement for self-test,
                // as it can fail if testing indoors against a very close object.
                if (dist >= 0 && dist <= 800) { 
                    setError(ErrorCode::OK);
                    return true;
                }
            }
            delay(5);
        }
        setError(ErrorCode::SENSOR_TIMEOUT);
        return false;
    }

    bool TFLunaDriver::reset() {
        // TFLuna has software reset command via UART, but for simplicity we flush buffers.
        if (_serial) {
            while(_serial->available()) _serial->read();
            return true;
        }
        return false;
    }

    bool TFLunaDriver::isConnected() const {
        return _connected;
    }

    bool TFLunaDriver::readRaw(uint16_t& distanceCm, uint16_t& signalStrength, uint16_t& temperature) {
        if (!_serial || !_connected) {
            setError(ErrorCode::SENSOR_DISCONNECTED);
            return false;
        }

        bool gotData = false;
        
        // Wait until we have at least one full frame in the buffer
        while (_serial->available() >= 9) {
            if (_serial->peek() == 0x59) {
                _serial->read(); // Consume the first 0x59
                
                if (_serial->peek() == 0x59) {
                    _serial->read(); // Consume the second 0x59
                    
                    uint8_t checksum = 0x59 + 0x59;
                    uint8_t data[7];
                    
                    for (int i = 0; i < 7; i++) {
                        data[i] = _serial->read();
                        if (i < 6) checksum += data[i];
                    }
                    
                    if (checksum == data[6]) {
                        distanceCm = data[0] | (data[1] << 8);
                        signalStrength = data[2] | (data[3] << 8);
                        temperature = data[4] | (data[5] << 8);
                        gotData = true;
                    }
                } 
            } else {
                // It's not 0x59, so it's a garbage/misaligned byte. Throw it away.
                _serial->read();
            }
        }
        
        if (gotData) {
            setError(ErrorCode::OK);
            return true;
        }
        
        return false;
    }

    ErrorCode TFLunaDriver::lastError() const {
        return _lastError;
    }

    const char* TFLunaDriver::name() const { return "TF-Luna"; }
    const char* TFLunaDriver::version() const { return "1.0.0"; }
    bool TFLunaDriver::supportsSelfTest() const { return true; }

} // namespace Drivers
} // namespace HealthKiosk
