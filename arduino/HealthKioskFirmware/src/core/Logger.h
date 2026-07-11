/**
 * @file Logger.h
 * @brief Simple logging utility that writes to Serial if enabled.
 * 
 * Dependencies: config/Config.h
 */

#ifndef LOGGER_H
#define LOGGER_H

#include <Arduino.h>

namespace HealthKiosk {
namespace Core {

    class Logger {
    public:
        static void info(const char* message);
        static void error(const char* message);
        static void debug(const char* message);
        static void logJSON(const char* jsonPayload);
    };

} // namespace Core
} // namespace HealthKiosk

#endif // LOGGER_H
