/**
 * @file Logger.cpp
 * @brief Implementation of Logger.
 * 
 * Dependencies: Logger.h, config/Config.h
 */

#include "Logger.h"
#include "../config/Config.h"

namespace HealthKiosk {
namespace Core {

    void Logger::info(const char* message) {
        if (!Config::IS_PRODUCTION_MODE) {
            Serial.print("[INFO] ");
            Serial.println(message);
        }
    }

    void Logger::error(const char* message) {
        // Errors might be printed even in production depending on the strategy,
        // but since production requires strict JSON, we should probably output JSON errors instead.
        if (!Config::IS_PRODUCTION_MODE) {
            Serial.print("[ERROR] ");
            Serial.println(message);
        }
    }

    void Logger::debug(const char* message) {
        if (!Config::IS_PRODUCTION_MODE) {
            Serial.print("[DEBUG] ");
            Serial.println(message);
        }
    }

    void Logger::logJSON(const char* jsonPayload) {
        // JSON is the primary output mode for both Dev and Prod.
        Serial.println(jsonPayload);
    }

} // namespace Core
} // namespace HealthKiosk
