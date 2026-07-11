/**
 * @file CalibrationData.h
 * @brief Calibration structures and default values for sensors.
 * 
 * This file manages calibration factors that could be stored in EEPROM
 * or loaded at boot time.
 * 
 * Dependencies: None
 */

#ifndef CALIBRATION_DATA_H
#define CALIBRATION_DATA_H

namespace HealthKiosk {
namespace Config {
namespace Calibration {

    // Default HX711 Load Cell calibration factor
    // This value must be derived using the ENTER_CALIBRATION command.
    constexpr float DEFAULT_WEIGHT_CALIBRATION_FACTOR = -7050.0f;
    constexpr float DEFAULT_WEIGHT_OFFSET = 0.0f;
    
    // Default MLX90614 Temperature offset (if needed for human body core estimation)
    constexpr float DEFAULT_TEMP_OFFSET = 1.5f; 
    
    // Height baseline (distance from sensor to floor in cm)
    constexpr float SENSOR_HEIGHT_FROM_FLOOR_CM = 200.0f;

} // namespace Calibration
} // namespace Config
} // namespace HealthKiosk

#endif // CALIBRATION_DATA_H
