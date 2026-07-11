/**
 * @file Calibration.h
 * @brief Calibration utilities for scaling and offsetting raw values.
 * 
 * Dependencies: None
 */

#ifndef CALIBRATION_H
#define CALIBRATION_H

namespace HealthKiosk {
namespace Algorithms {

    class Calibration {
    public:
        /**
         * @brief Applies linear calibration (y = mx + b)
         * @param rawValue The raw sensor reading
         * @param scaleFactor The multiplier (m)
         * @param offset The additive offset (b)
         * @return Calibrated value
         */
        static float applyLinear(float rawValue, float scaleFactor, float offset);
    };

} // namespace Algorithms
} // namespace HealthKiosk

#endif // CALIBRATION_H
