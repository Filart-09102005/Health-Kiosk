/**
 * @file SensorProfiles.h
 * @brief Configuration profiles for sensor measurements.
 * 
 * Defines sample counts, stability thresholds, and specific timeouts 
 * for the different measurement algorithms.
 * 
 * Dependencies: None
 */

#ifndef SENSOR_PROFILES_H
#define SENSOR_PROFILES_H

#include <stdint.h>

namespace HealthKiosk {
namespace Config {
namespace Profiles {

    // Temperature (MLX90614)
    constexpr uint16_t TEMP_SAMPLE_COUNT = 10;
    constexpr float TEMP_STABLE_THRESHOLD = 0.3f;
    constexpr unsigned long TEMP_STABILITY_MS = 600;   // Real-time-based hold-steady window before READY
    constexpr unsigned long TEMP_COUNTDOWN_MS = 1000;  // Countdown before COLLECTING starts
    constexpr unsigned long TEMP_TIMEOUT_MS = 60000;
    constexpr float TEMP_MIN_VALID = 30.0f;
    constexpr float TEMP_MAX_VALID = 43.0f;

    // Weight (HX711)
    constexpr uint16_t WEIGHT_SAMPLE_COUNT = 20;
    constexpr float WEIGHT_STABLE_THRESHOLD = 0.6f; // kg
    constexpr unsigned long WEIGHT_TIMEOUT_MS = 60000; // Increased to 60s for stabilization
    constexpr float WEIGHT_MIN_VALID = 0.0f; // Allow 0 to be valid for basic testing
    constexpr float WEIGHT_MAX_VALID = 250.0f;

    // Height (TF-Luna)
    constexpr uint16_t HEIGHT_SAMPLE_COUNT = 10;
    constexpr float HEIGHT_STABLE_THRESHOLD = 1.0f; // cm
    constexpr unsigned long HEIGHT_TIMEOUT_MS = 60000; // Increased to 60s
    constexpr float HEIGHT_MIN_VALID = 0.0f; // Allow low heights for testing
    constexpr float HEIGHT_MAX_VALID = 250.0f;

} // namespace Profiles
} // namespace Config
} // namespace HealthKiosk

#endif // SENSOR_PROFILES_H
