/**
 * @file Statistics.cpp
 * @brief Implementation of Statistics.
 * 
 * Dependencies: Statistics.h, <math.h>
 */

#include "Statistics.h"
#include <math.h>

namespace HealthKiosk {
namespace Algorithms {

    float Statistics::computeVariance(const float* data, size_t size, float mean) {
        if (size <= 1) return 0.0f;
        
        float sumOfSquares = 0.0f;
        for (size_t i = 0; i < size; ++i) {
            float diff = data[i] - mean;
            sumOfSquares += (diff * diff);
        }
        
        return sumOfSquares / static_cast<float>(size - 1); // Sample variance
    }

    float Statistics::computeStdDev(float variance) {
        if (variance <= 0.0f) return 0.0f;
        return sqrt(variance);
    }

} // namespace Algorithms
} // namespace HealthKiosk
