/**
 * @file TFLunaDriver.h
 * @brief Dumb driver for the TF-Luna LiDAR sensor over UART.
 * 
 * Dependencies: config/ErrorCodes.h, HardwareSerial
 */

#ifndef TFLUNA_DRIVER_H
#define TFLUNA_DRIVER_H

#include "../config/ErrorCodes.h"
#include <HardwareSerial.h>

namespace HealthKiosk {
namespace Drivers {

    class TFLunaDriver {
    private:
        HardwareSerial* _serial;
        ErrorCode _lastError;
        bool _connected;

        void setError(ErrorCode err);

    public:
        TFLunaDriver(HardwareSerial* serialPort);

        bool begin(uint32_t baudRate = 115200);
        bool selfTest();
        bool reset();
        bool isConnected() const;
        
        bool readRaw(uint16_t& distanceCm, uint16_t& signalStrength, uint16_t& temperature);
        
        ErrorCode lastError() const;

        const char* name() const;
        const char* version() const;
        bool supportsSelfTest() const;
    };

} // namespace Drivers
} // namespace HealthKiosk

#endif // TFLUNA_DRIVER_H
