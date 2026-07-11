/**
 * @file Config.h
 * @brief Main configuration toggles for the firmware.
 * 
 * Used to switch between production and development builds.
 * 
 * Dependencies: None
 */

#ifndef CONFIG_H
#define CONFIG_H

namespace HealthKiosk {
namespace Config {

    // Build Modes
    // Set to true for Production: LCD Disabled, Serial JSON Only
    // Set to false for Development: LCD Enabled, Verbose Serial Debugging
    constexpr bool IS_PRODUCTION_MODE = true;

    // Enable/Disable specific sensors for testing
    constexpr bool ENABLE_TEMPERATURE = true;
    constexpr bool ENABLE_HEART_RATE  = true;
    constexpr bool ENABLE_WEIGHT      = true;
    constexpr bool ENABLE_HEIGHT      = true;

} // namespace Config
} // namespace HealthKiosk

#endif // CONFIG_H
