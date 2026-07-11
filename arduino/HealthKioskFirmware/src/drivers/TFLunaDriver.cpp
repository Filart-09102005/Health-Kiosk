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
        // Give it up to 1000ms to produce a valid, fresh frame
        while (millis() - start < 1000) {
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

        // TFLuna Frame: 0x59 0x59 Dist_L Dist_H Strength_L Strength_H Temp_L Temp_H Checksum
        if (_serial->available() >= 9) {
            if (_serial->read() == 0x59) {
                if (_serial->read() == 0x59) {
                    uint8_t uart_data[7];
                    for (int i = 0; i < 7; i++) {
                        uart_data[i] = _serial->read();
                    }
                    
                    uint8_t checksum = 0x59 + 0x59;
                    for (int i = 0; i < 6; i++) {
                        checksum += uart_data[i];
                    }
                    
                    if (checksum == uart_data[6]) {
                        distanceCm = uart_data[0] | (uart_data[1] << 8);
                        signalStrength = uart_data[2] | (uart_data[3] << 8);
                        temperature = uart_data[4] | (uart_data[5] << 8); // Scaled
                        
                        setError(ErrorCode::OK);
                        return true;
                    } else {
                        setError(ErrorCode::SENSOR_OUT_OF_RANGE); // Checksum error
                        return false;
                    }
                }
            }
        }
        setError(ErrorCode::SENSOR_TIMEOUT);
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
