/**
 * @file Diagnostics.h
 * @brief Tracks system health, measurement counts, errors, and uptime.
 * 
 * Dependencies: config/ErrorCodes.h
 */

#ifndef DIAGNOSTICS_H
#define DIAGNOSTICS_H

#include <stdint.h>
#include <stddef.h>
#include "../config/ErrorCodes.h"

namespace HealthKiosk {
namespace Diagnostics {

    class SystemDiagnostics {
    private:
        unsigned long bootTimeMillis;
        unsigned int measurementCount;
        unsigned int errorCount;
        ErrorCode lastError;
        
        bool mlx90614_ok;
        bool max30102_ok;
        bool hx711_ok;
        bool tfluna_ok;

    public:
        SystemDiagnostics();

        void recordMeasurement();
        void recordError(ErrorCode code);
        
        void setSensorStatus(bool mlx, bool max, bool hx, bool tfluna);

        unsigned long getUptimeMillis() const;
        unsigned int getMeasurementCount() const;
        unsigned int getErrorCount() const;
        ErrorCode getLastError() const;
        
        // Memory estimate (free RAM)
        static int getFreeRam();
        
        // Returns a JSON string of diagnostics (requires a buffer)
        void getDiagnosticsJSON(char* buffer, size_t bufferSize) const;
    };

    // Global singleton for diagnostics
    extern SystemDiagnostics systemDiagnostics;

} // namespace Diagnostics
} // namespace HealthKiosk

#endif // DIAGNOSTICS_H
