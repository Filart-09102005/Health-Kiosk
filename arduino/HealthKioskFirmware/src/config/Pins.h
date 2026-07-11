/**
 * @file Pins.h
 * @brief Pin definitions for the Arduino Mega 2560 hardware.
 * 
 * This file centralizes all pin assignments to ensure no conflicts occur.
 * 
 * Dependencies: None
 */

#ifndef PINS_H
#define PINS_H

#include <Arduino.h>

namespace HealthKiosk {
namespace Config {
namespace Pins {

    // I2C Pins (Mega 2560)
    // SDA: 20
    // SCL: 21
    // Used by: MLX90614 (Temperature), MAX30102 (Heart/SpO2)
    
    // HX711 (Weight Load Cells)
    constexpr uint8_t HX711_DOUT_PIN = 3;
    constexpr uint8_t HX711_SCK_PIN  = 2;
    
    // TF-Luna (Height LiDAR)
    // Uses Serial1 or Serial2 depending on wiring. 
    // Assuming Serial2 for TF-Luna (RX2: 17, TX2: 16)
    // No specific pin definitions needed if using HardwareSerial, 
    // but documented here for clarity.
    
    // Optional LCD (if used in Dev mode)
    // e.g., I2C address 0x27

} // namespace Pins
} // namespace Config
} // namespace HealthKiosk

#endif // PINS_H
