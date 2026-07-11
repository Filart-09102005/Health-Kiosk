/**
 * @file IHardwareModule.h
 * @brief Common interface for all Hardware Abstraction Layer modules.
 * 
 * Dependencies: config/ErrorCodes.h
 */

#ifndef I_HARDWARE_MODULE_H
#define I_HARDWARE_MODULE_H

#include "../config/ErrorCodes.h"

namespace HealthKiosk {
namespace HAL {

    class IHardwareModule {
    public:
        virtual bool initialize() = 0;
        virtual bool selfTest() = 0;
        virtual bool reset() = 0;
        virtual bool isReady() const = 0;
        virtual ErrorCode lastError() const = 0;
        virtual ~IHardwareModule() {}
    };

} // namespace HAL
} // namespace HealthKiosk

#endif // I_HARDWARE_MODULE_H
