/**
 * @file MeasurementResult.h
 * @brief Base structures for all sensor measurements.
 * 
 * Defines the standard return type from any HAL or Measurement Module.
 * Consolidates all specific result types.
 * 
 * Dependencies: config/ErrorCodes.h
 */

#ifndef MEASUREMENT_RESULT_H
#define MEASUREMENT_RESULT_H

#include "../config/ErrorCodes.h"

namespace HealthKiosk {
namespace Models {

    struct QualityFlags {
        bool signalStable = false;
        bool enoughSamples = false;
        bool targetDetected = false; // finger or person
        bool motionDetected = false;
        bool passedValidation = false;
    };

    struct MeasurementResult {
        float value = 0.0f;              // The final calculated and calibrated value
        float confidence = 0.0f;         // 0.0 to 100.0
        unsigned int sampleCount = 0;    // Number of samples used
        unsigned long measurementTime = 0; // ms taken to measure
        float stabilityScore = 0.0f;     // e.g. based on variance
        float qualityScore = 0.0f;       // e.g. signal strength or noise level
        ErrorCode error = ErrorCode::OK;
        unsigned long timestamp = 0;     // System uptime when finalized
        
        QualityFlags flags;
        
        // For multi-value sensors like Heart Rate + SpO2
        float secondaryValue = 0.0f; 

        bool isValid() const {
            return error == ErrorCode::OK;
        }
    };

} // namespace Models
} // namespace HealthKiosk

#endif // MEASUREMENT_RESULT_H
