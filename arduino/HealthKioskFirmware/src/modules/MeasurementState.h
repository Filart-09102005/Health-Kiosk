/**
 * @file MeasurementState.h
 * @brief Common state machine enum for all Measurement Modules.
 * 
 * Dependencies: None
 */

#ifndef MEASUREMENT_STATE_H
#define MEASUREMENT_STATE_H

namespace HealthKiosk {
namespace Modules {

    enum class MeasureState {
        IDLE,
        INITIALIZE,
        WAIT_FOR_SENSOR,
        COLLECT_SAMPLES,
        FILTER,
        STABILITY_CHECK,
        CONFIDENCE_CHECK,
        CALIBRATION,
        VALIDATION,
        COMPLETE,
        ERROR
    };

} // namespace Modules
} // namespace HealthKiosk

#endif // MEASUREMENT_STATE_H
