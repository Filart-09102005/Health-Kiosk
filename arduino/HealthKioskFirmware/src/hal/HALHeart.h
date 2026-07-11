/**
 * @file HALHeart.h
 * @brief HAL for Heart Rate / SpO2 measurement.
 * 
 * Wraps MAX30102Driver. Provides configuration and raw FIFO polling.
 * 
 * Dependencies: IHardwareModule.h, drivers/MAX30102Driver.h
 */

#ifndef HAL_HEART_H
#define HAL_HEART_H

#include "IHardwareModule.h"
#include "../drivers/MAX30102Driver.h"

namespace HealthKiosk {
namespace HAL {

    class HALHeart : public IHardwareModule {
    private:
        Drivers::MAX30102Driver driver;

    public:
        HALHeart();

        bool initialize() override;
        bool selfTest() override;
        bool reset() override;
        bool isReady() const override;
        ErrorCode lastError() const override;

        /**
         * @brief Checks if a new sample is ready.
         */
        bool hasNewSample();

        /**
         * @brief Acquires the next raw red and IR sample from the FIFO.
         */
        bool acquire(uint32_t& red, uint32_t& ir);
    };

} // namespace HAL
} // namespace HealthKiosk

#endif // HAL_HEART_H
