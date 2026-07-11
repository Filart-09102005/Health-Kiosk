/**
 * @file HALTemperature.h
 * @brief HAL for Temperature measurement.
 * 
 * Wraps MLX90614Driver. Converts raw values if necessary.
 * 
 * Dependencies: IHardwareModule.h, drivers/MLX90614Driver.h
 */

#ifndef HAL_TEMPERATURE_H
#define HAL_TEMPERATURE_H

#include "IHardwareModule.h"
#include "../drivers/MLX90614Driver.h"

namespace HealthKiosk {
namespace HAL {

    class HALTemperature : public IHardwareModule {
    private:
        Drivers::MLX90614Driver driver;

    public:
        HALTemperature();

        bool initialize() override;
        bool selfTest() override;
        bool reset() override;
        bool isReady() const override;
        ErrorCode lastError() const override;

        /**
         * @brief Acquires the temperature.
         * @param objectTempC Output parameter for object temperature.
         * @param ambientTempC Output parameter for ambient temperature.
         * @return true if successful.
         */
        bool acquire(float& objectTempC, float& ambientTempC);
    };

} // namespace HAL
} // namespace HealthKiosk

#endif // HAL_TEMPERATURE_H
