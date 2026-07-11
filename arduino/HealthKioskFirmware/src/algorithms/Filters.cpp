/**
 * @file Filters.cpp
 * @brief Implementation of reusable DSP filters.
 * 
 * Dependencies: Filters.h, utils/MathUtils.h
 */

#include "Filters.h"
#include "../utils/MathUtils.h"

namespace HealthKiosk {
namespace Algorithms {

    // Simple bubble sort for small arrays, sufficient for sensor buffers (e.g., 10-150 items)
    // For very large buffers on Mega 2560, we might want insertion sort or shell sort.
    static void sortArray(float* data, size_t size) {
        for (size_t i = 0; i < size - 1; ++i) {
            for (size_t j = 0; j < size - i - 1; ++j) {
                if (data[j] > data[j + 1]) {
                    float temp = data[j];
                    data[j] = data[j + 1];
                    data[j + 1] = temp;
                }
            }
        }
    }

    float Filters::computeEMA(float currentValue, float previousEMA, float alpha) {
        return (alpha * currentValue) + ((1.0f - alpha) * previousEMA);
    }

    float Filters::computeMedian(float* data, size_t size) {
        if (size == 0) return 0.0f;
        if (size == 1) return data[0];

        sortArray(data, size);

        if (size % 2 == 0) {
            return (data[size / 2 - 1] + data[size / 2]) / 2.0f;
        } else {
            return data[size / 2];
        }
    }

    float Filters::computeMAD(const float* data, size_t size, float median, float* workBuffer) {
        if (size == 0) return 0.0f;

        for (size_t i = 0; i < size; ++i) {
            workBuffer[i] = Utils::MathUtils::absolute(data[i] - median);
        }

        return computeMedian(workBuffer, size);
    }

} // namespace Algorithms
} // namespace HealthKiosk
