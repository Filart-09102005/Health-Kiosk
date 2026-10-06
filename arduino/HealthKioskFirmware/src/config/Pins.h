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

    // I2C Pins (Mega 2560) — final
    // SDA: 20
    // SCL: 21
    // Used by: MLX90614 (Temperature), address 0x5A
    constexpr uint8_t I2C_SDA_PIN = 20;
    constexpr uint8_t I2C_SCL_PIN = 21;
    constexpr uint8_t MLX90614_I2C_ADDRESS = 0x5A;

    // HX711 (Weight Load Cells)
    constexpr uint8_t HX711_DOUT_PIN = 3;
    constexpr uint8_t HX711_SCK_PIN  = 2;

    // TF-Luna (Height LiDAR) — final
    // Wired on Serial1: TF-Luna TX -> Mega RX1 (19), TF-Luna RX -> Mega TX1 (18).
    // HardwareSerial (Serial1) is used directly, so no GPIO pin constants are
    // needed for data — these are documented for wiring reference only.
    constexpr uint8_t TFLUNA_SERIAL1_RX_PIN = 19; // Mega RX1 <- TF-Luna TX
    constexpr uint8_t TFLUNA_SERIAL1_TX_PIN = 18; // Mega TX1 -> TF-Luna RX
    constexpr uint32_t TFLUNA_BAUD_RATE = 115200;

    // Optional LCD (if used in Dev mode)
    // e.g., I2C address 0x27

} // namespace Pins
} // namespace Config
} // namespace HealthKiosk

#endif // PINS_H
