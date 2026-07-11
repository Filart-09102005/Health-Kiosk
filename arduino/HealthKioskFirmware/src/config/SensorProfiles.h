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
    constexpr uint16_t TEMP_SAMPLE_COUNT = 30;
    constexpr float TEMP_STABLE_THRESHOLD = 0.2f;
    constexpr unsigned long TEMP_TIMEOUT_MS = 2000;
    constexpr float TEMP_MIN_VALID = 30.0f;
    constexpr float TEMP_MAX_VALID = 43.0f;

    // Weight (HX711)
    constexpr uint16_t WEIGHT_SAMPLE_COUNT = 50;
    constexpr float WEIGHT_STABLE_THRESHOLD = 0.1f; // kg
    constexpr unsigned long WEIGHT_TIMEOUT_MS = 3000;
    constexpr float WEIGHT_MIN_VALID = 20.0f;
    constexpr float WEIGHT_MAX_VALID = 250.0f;

    // Height (TF-Luna)
    constexpr uint16_t HEIGHT_SAMPLE_COUNT = 50;
    constexpr float HEIGHT_STABLE_THRESHOLD = 1.0f; // cm
    constexpr unsigned long HEIGHT_TIMEOUT_MS = 2000;
    constexpr float HEIGHT_MIN_VALID = 80.0f;
    constexpr float HEIGHT_MAX_VALID = 250.0f;

    // Heart Rate & SpO2 (MAX30102)
    constexpr unsigned long HEART_MIN_MS = 10000;
    constexpr unsigned long HEART_TIMEOUT_MS = 20000;
    constexpr float HEART_BPM_MIN = 30.0f;
    constexpr float HEART_BPM_MAX = 220.0f;
    constexpr float HEART_SPO2_MIN = 70.0f;
    constexpr float HEART_SPO2_MAX = 100.0f;

} // namespace Profiles
} // namespace Config
} // namespace HealthKiosk

#endif // SENSOR_PROFILES_H
