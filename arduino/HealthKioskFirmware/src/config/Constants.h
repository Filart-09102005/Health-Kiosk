/**
 * @file Constants.h
 * @brief Global system constants and tuning parameters.
 * 
 * Defines timeouts, delays, and threshold values for measurements.
 * 
 * Dependencies: None
 */

#ifndef CONSTANTS_H
#define CONSTANTS_H

#include <stdint.h>

namespace HealthKiosk {
namespace Config {
namespace Constants {

    // Serial Communication
    constexpr uint32_t SERIAL_BAUD_RATE = 115200;
    
    // Timeouts
    constexpr uint32_t COMMAND_TIMEOUT_MS = 30000;       // 30 seconds wait for command
    constexpr uint32_t MEASUREMENT_TIMEOUT_MS = 60000;   // 60 seconds max per measurement
    constexpr uint32_t SENSOR_INIT_TIMEOUT_MS = 5000;    // 5 seconds max for sensor init
    
    // Serial Protocol
    constexpr uint16_t SERIAL_BUFFER_SIZE = 512;
    


} // namespace Constants
} // namespace Config
} // namespace HealthKiosk

#endif // CONSTANTS_H
