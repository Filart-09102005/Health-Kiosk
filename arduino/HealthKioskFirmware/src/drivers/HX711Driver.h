/**
 * @file HX711Driver.h
 * @brief Dumb driver for the HX711 load cell amplifier.
 * 
 * Dependencies: bogde/HX711 library, config/ErrorCodes.h
 */

#ifndef HX711_DRIVER_H
#define HX711_DRIVER_H

#include "../config/ErrorCodes.h"
#include <HX711.h>

namespace HealthKiosk {
namespace Drivers {

    class HX711Driver {
    private:
        HX711 hx;
        uint8_t _doutPin;
        uint8_t _sckPin;
        ErrorCode _lastError;
        bool _connected;

        void setError(ErrorCode err);

    public:
        HX711Driver(uint8_t doutPin, uint8_t sckPin);

        bool begin();
        bool selfTest();
        bool reset();
        bool isConnected() const;
        
        bool readRaw(long& rawValue);
        
        // Basic hardware power down/up
        void powerDown();
        void powerUp();

        ErrorCode lastError() const;

        const char* name() const;
        const char* version() const;
        bool supportsSelfTest() const;
    };

} // namespace Drivers
} // namespace HealthKiosk

#endif // HX711_DRIVER_H
