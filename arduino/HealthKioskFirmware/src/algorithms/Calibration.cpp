/**
 * @file Calibration.cpp
 * @brief Implementation of Calibration utilities.
 * 
 * Dependencies: Calibration.h
 */

#include "Calibration.h"

namespace HealthKiosk {
namespace Algorithms {

    float Calibration::applyLinear(float rawValue, float scaleFactor, float offset) {
        return (rawValue * scaleFactor) + offset;
    }

} // namespace Algorithms
} // namespace HealthKiosk
