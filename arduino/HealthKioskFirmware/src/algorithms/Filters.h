/**
 * @file Filters.h
 * @brief Reusable DSP filters (EMA, Median, MAD).
 * 
 * These filters are used by all measurement modules to reject noise 
 * and stabilize sensor readings.
 * 
 * Dependencies: utils/MathUtils.h
 */

#ifndef FILTERS_H
#define FILTERS_H

#include <stdint.h>
#include <stddef.h>

namespace HealthKiosk {
namespace Algorithms {

    class Filters {
    public:
        /**
         * @brief Exponential Moving Average (EMA)
         * @param currentValue The newly sampled value
         * @param previousEMA The EMA from the previous step
         * @param alpha The smoothing factor (0.0 to 1.0)
         * @return The updated EMA value
         */
        static float computeEMA(float currentValue, float previousEMA, float alpha);

        /**
         * @brief Computes the median of an array of floats.
         * @param data The array of data (WILL BE SORTED IN PLACE)
         * @param size The number of elements in the array
         * @return The median value
         */
        static float computeMedian(float* data, size_t size);

        /**
         * @brief Computes the Median Absolute Deviation (MAD).
         * @param data The array of data
         * @param size The number of elements in the array
         * @param median The pre-computed median of the data
         * @param workBuffer A buffer of equal size to store absolute deviations (WILL BE SORTED IN PLACE)
         * @return The MAD value
         */
        static float computeMAD(const float* data, size_t size, float median, float* workBuffer);
    };

} // namespace Algorithms
} // namespace HealthKiosk

#endif // FILTERS_H
