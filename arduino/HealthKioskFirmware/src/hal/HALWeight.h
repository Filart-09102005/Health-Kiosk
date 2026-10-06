/**
 * @file HALWeight.h
 * @brief HAL for Weight measurement.
 * 
 * Wraps HX711Driver. Converts raw ADC counts to kg using calibration data.
 * 
 * Dependencies: IHardwareModule.h, drivers/HX711Driver.h
 */

#ifndef HAL_WEIGHT_H
#define HAL_WEIGHT_H

#include "IHardwareModule.h"
#include "../drivers/HX711Driver.h"

namespace HealthKiosk {
namespace HAL {

    class HALWeight : public IHardwareModule {
    private:
        Drivers::HX711Driver driver;
        float _scaleFactor;
        long _offset;

    public:
        HALWeight(uint8_t doutPin, uint8_t sckPin);

        bool initialize() override;
        bool selfTest() override;
        bool reset() override;
        bool isReady() const override;
        ErrorCode lastError() const override;

        /**
         * @brief Acquires a raw weight reading and calibrates it to Kg.
         * @param weightKg Output parameter for weight in Kg.
         * @return true if successful.
         */
        bool acquire(float& weightKg);
        
        /**
         * @brief Updates calibration parameters.
         */
        void setCalibration(float scale, long offset);
        
        /**
         * @brief Zeroes the scale by reading the current empty weight.
         */
        void tare();
    };

} // namespace HAL
} // namespace HealthKiosk

#endif // HAL_WEIGHT_H
