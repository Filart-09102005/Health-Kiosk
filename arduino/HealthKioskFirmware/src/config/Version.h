/**
 * @file Version.h
 * @brief Firmware version definitions for the SMCBI Health Kiosk.
 * 
 * This file contains the versioning information used by the firmware. 
 * The Python bridge validates the PROTOCOL_VERSION to ensure compatibility 
 * before allowing measurements.
 * 
 * Dependencies: None
 */

#ifndef VERSION_H
#define VERSION_H

namespace HealthKiosk {
namespace Config {

    // Firmware Version
    constexpr const char* FW_VERSION = "2.0.0";
    
    // Build Number (increment for every release)
    constexpr unsigned int BUILD_NUMBER = 100;
    
    // Build Date
    constexpr const char* BUILD_DATE = __DATE__ " " __TIME__;
    
    // Protocol Version
    // The Python bridge MUST support this protocol version to communicate.
    constexpr const char* PROTOCOL_VERSION = "2.0";

} // namespace Config
} // namespace HealthKiosk

#endif // VERSION_H
