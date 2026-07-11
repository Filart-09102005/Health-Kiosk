/**
 * @file ErrorCodes.h
 * @brief Standardized error codes for the firmware.
 * 
 * Used across drivers, HAL, and modules to report exact failure modes.
 * 
 * Dependencies: None
 */

#ifndef ERROR_CODES_H
#define ERROR_CODES_H

namespace HealthKiosk {

    enum class ErrorCode {
        OK = 0,
        SENSOR_TIMEOUT = 1001,
        SENSOR_DISCONNECTED = 1002,
        SENSOR_NOT_STABLE = 1003,
        SENSOR_OUT_OF_RANGE = 1004,
        CALIBRATION_REQUIRED = 1005,
        INVALID_COMMAND = 2001,
        JSON_ERROR = 2002,
        WATCHDOG_TRIGGERED = 9001
    };

} // namespace HealthKiosk

#endif // ERROR_CODES_H
