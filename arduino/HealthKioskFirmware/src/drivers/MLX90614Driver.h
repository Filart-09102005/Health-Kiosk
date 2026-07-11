/**
 * @file MLX90614Driver.h
 * @brief Dumb driver for the MLX90614 temperature sensor.
 * 
 * Responsibilities:
 * - Hardware initialization
 * - Register access and raw sensor reading
 * - Communication checks and timeouts
 * - Self-test
 * 
 * Dependencies: Adafruit_MLX90614 library, config/ErrorCodes.h
 */

#ifndef MLX90614_DRIVER_H
#define MLX90614_DRIVER_H

#include "../config/ErrorCodes.h"
#include <Adafruit_MLX90614.h>

namespace HealthKiosk {
namespace Drivers {

    class MLX90614Driver {
    private:
        Adafruit_MLX90614 mlx;
        ErrorCode _lastError;
        bool _connected;

        void setError(ErrorCode err);

    public:
        MLX90614Driver();

        bool begin();
        bool selfTest();
        bool reset();
        bool isConnected() const;
        
        bool readRaw(float& objectTempC, float& ambientTempC);
        
        ErrorCode lastError() const;

        const char* name() const;
        const char* version() const;
        bool supportsSelfTest() const;
    };

} // namespace Drivers
} // namespace HealthKiosk

#endif // MLX90614_DRIVER_H
