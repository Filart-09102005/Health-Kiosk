/**
 * @file SignalQuality.h
 * @brief Evaluates the quality and stability of sensor signals.
 * 
 * Dependencies: utils/CircularBuffer.h
 */

#ifndef SIGNAL_QUALITY_H
#define SIGNAL_QUALITY_H

#include <stddef.h>

namespace HealthKiosk {
namespace Algorithms {

    class SignalQuality {
    public:
        /**
         * @brief Checks if a buffer of values is stable within a threshold
         * @param data Array of recent data points
         * @param size Number of elements
         * @param maxVariance Allowed variance threshold for stability
         * @return True if stable
         */
        static bool isStable(const float* data, size_t size, float maxVariance);
        
        /**
         * @brief Computes a normalized confidence score (0.0 - 1.0) based on MAD
         * @param currentMAD The Median Absolute Deviation
         * @param idealMAD The expected ideal MAD for this sensor
         * @param worstMAD The MAD at which confidence drops to 0
         * @return Confidence score from 0.0f to 1.0f
         */
        static float computeConfidence(float currentMAD, float idealMAD, float worstMAD);
    };

} // namespace Algorithms
} // namespace HealthKiosk

#endif // SIGNAL_QUALITY_H
