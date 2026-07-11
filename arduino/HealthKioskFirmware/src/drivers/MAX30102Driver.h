/**
 * @file MAX30102Driver.h
 * @brief Dumb driver for the MAX30102 Pulse Oximeter.
 * 
 * Dependencies: SparkFun_MAX3010x_Sensor_Library, config/ErrorCodes.h
 */

#ifndef MAX30102_DRIVER_H
#define MAX30102_DRIVER_H

#include "../config/ErrorCodes.h"
#include <MAX30105.h> // The SparkFun library uses this header for MAX30102 as well

namespace HealthKiosk {
namespace Drivers {

    class MAX30102Driver {
    private:
        MAX30105 particleSensor;
        ErrorCode _lastError;
        bool _connected;

        void setError(ErrorCode err);

    public:
        MAX30102Driver();

        bool begin(uint8_t ledBrightness = 60, uint8_t sampleAverage = 4, uint8_t ledMode = 2, int sampleRate = 100, int pulseWidth = 411, int adcRange = 4096);
        bool selfTest();
        bool reset();
        bool isConnected() const;
        
        // Checks if new samples are available in the FIFO
        bool check();
        
        // Retrieves the oldest unread sample from the FIFO
        bool readRaw(uint32_t& red, uint32_t& ir);
        
        ErrorCode lastError() const;

        const char* name() const;
        const char* version() const;
        bool supportsSelfTest() const;
    };

} // namespace Drivers
} // namespace HealthKiosk

#endif // MAX30102_DRIVER_H
