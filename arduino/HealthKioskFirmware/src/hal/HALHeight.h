/**
 * @file HALHeight.h
 * @brief HAL for Height measurement.
 * 
 * Wraps TFLunaDriver. Converts LiDAR distance into patient height.
 * 
 * Dependencies: IHardwareModule.h, drivers/TFLunaDriver.h
 */

#ifndef HAL_HEIGHT_H
#define HAL_HEIGHT_H

#include "IHardwareModule.h"
#include "../drivers/TFLunaDriver.h"

namespace HealthKiosk {
namespace HAL {

    class HALHeight : public IHardwareModule {
    private:
        Drivers::TFLunaDriver driver;
        float _sensorHeightCm;

    public:
        HALHeight(HardwareSerial* serialPort);

        bool initialize() override;
        bool selfTest() override;
        bool reset() override;
        bool isReady() const override;
        ErrorCode lastError() const override;

        /**
         * @brief Acquires the height of the person in cm.
         * @param heightCm Output parameter for height in cm.
         * @return true if successful.
         */
        bool acquire(float& heightCm);
        
        /**
         * @brief Updates the total installation height of the sensor.
         */
        void setSensorHeight(float heightFromFloor);
    };

} // namespace HAL
} // namespace HealthKiosk

#endif // HAL_HEIGHT_H
