/**
 * @file MathUtils.h
 * @brief Common mathematical utilities.
 * 
 * Dependencies: None
 */

#ifndef MATH_UTILS_H
#define MATH_UTILS_H

namespace HealthKiosk {
namespace Utils {

    class MathUtils {
    public:
        // Returns the absolute value
        static float absolute(float value) {
            return value < 0 ? -value : value;
        }

        // Clamps a value between min and max
        template <typename T>
        static T clamp(const T& value, const T& minVal, const T& maxVal) {
            if (value < minVal) return minVal;
            if (value > maxVal) return maxVal;
            return value;
        }
    };

} // namespace Utils
} // namespace HealthKiosk

#endif // MATH_UTILS_H
