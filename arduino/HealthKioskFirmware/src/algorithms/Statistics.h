/**
 * @file Statistics.h
 * @brief Computes standard deviation and variance for confidence scoring.
 * 
 * Dependencies: utils/MathUtils.h
 */

#ifndef STATISTICS_H
#define STATISTICS_H

#include <stddef.h>

namespace HealthKiosk {
namespace Algorithms {

    class Statistics {
    public:
        /**
         * @brief Computes the variance of a dataset
         * @param data The array of data
         * @param size The number of elements
         * @param mean The pre-computed mean of the data
         * @return The variance
         */
        static float computeVariance(const float* data, size_t size, float mean);

        /**
         * @brief Computes the standard deviation (requires sqrt, can be slow)
         * @param variance The variance
         * @return The standard deviation
         */
        static float computeStdDev(float variance);
    };

} // namespace Algorithms
} // namespace HealthKiosk

#endif // STATISTICS_H
