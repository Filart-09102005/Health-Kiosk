/**
 * @file SignalQuality.cpp
 * @brief Implementation of Signal Quality analysis.
 * 
 * Dependencies: SignalQuality.h, Statistics.h, utils/MathUtils.h
 */

#include "SignalQuality.h"
#include "Statistics.h"
#include "../utils/MathUtils.h"

namespace HealthKiosk {
namespace Algorithms {

    bool SignalQuality::isStable(const float* data, size_t size, float maxVariance) {
        if (size <= 1) return false;

        float sum = 0.0f;
        for(size_t i=0; i<size; i++) sum += data[i];
        float mean = sum / static_cast<float>(size);

        float variance = Statistics::computeVariance(data, size, mean);
        
        return variance <= maxVariance;
    }

    float SignalQuality::computeConfidence(float currentMAD, float idealMAD, float worstMAD) {
        if (currentMAD <= idealMAD) return 1.0f;
        if (currentMAD >= worstMAD) return 0.0f;

        float range = worstMAD - idealMAD;
        float position = currentMAD - idealMAD;
        
        float confidence = 1.0f - (position / range);
        
        return Utils::MathUtils::clamp(confidence, 0.0f, 1.0f);
    }

} // namespace Algorithms
} // namespace HealthKiosk
