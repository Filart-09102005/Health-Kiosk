/**
 * @file Diagnostics.cpp
 * @brief Implementation of SystemDiagnostics.
 * 
 * Dependencies: Diagnostics.h, config/Version.h
 */

#include "Diagnostics.h"
#include "../config/Version.h"
#include <Arduino.h>

namespace HealthKiosk {
namespace Diagnostics {

    SystemDiagnostics systemDiagnostics;

    SystemDiagnostics::SystemDiagnostics() 
        : bootTimeMillis(0), measurementCount(0), errorCount(0), lastError(ErrorCode::OK),
          mlx90614_ok(false), max30102_ok(false), hx711_ok(false), tfluna_ok(false) {
    }

    void SystemDiagnostics::recordMeasurement() {
        measurementCount++;
    }

    void SystemDiagnostics::recordError(ErrorCode code) {
        errorCount++;
        lastError = code;
    }

    void SystemDiagnostics::setSensorStatus(bool mlx, bool max, bool hx, bool tfluna) {
        mlx90614_ok = mlx;
        max30102_ok = max;
        hx711_ok = hx;
        tfluna_ok = tfluna;
    }

    unsigned long SystemDiagnostics::getUptimeMillis() const {
        return millis() - bootTimeMillis; // Note: overflows every ~50 days
    }

    unsigned int SystemDiagnostics::getMeasurementCount() const {
        return measurementCount;
    }

    unsigned int SystemDiagnostics::getErrorCount() const {
        return errorCount;
    }

    ErrorCode SystemDiagnostics::getLastError() const {
        return lastError;
    }

    int SystemDiagnostics::getFreeRam() {
        extern int __heap_start, *__brkval;
        int v;
        return (int) &v - (__brkval == 0 ? (int) &__heap_start : (int) __brkval);
    }

    void SystemDiagnostics::getDiagnosticsJSON(char* buffer, size_t bufferSize) const {
        // In a real implementation we would use ArduinoJson. 
        // For Phase 2, we just construct a basic string since ArduinoJson will be integrated in Phase 6.
        snprintf(buffer, bufferSize, 
            "{\"protocol\":\"%s\",\"type\":\"diagnostics\",\"firmware\":\"%s\",\"uptime\":%lu,\"measurements\":%u,\"errors\":%u,\"ram\":%d}",
            Config::PROTOCOL_VERSION,
            Config::FW_VERSION,
            getUptimeMillis(),
            measurementCount,
            errorCount,
            getFreeRam()
        );
    }

} // namespace Diagnostics
} // namespace HealthKiosk
