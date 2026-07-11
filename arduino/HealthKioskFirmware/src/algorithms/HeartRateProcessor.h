/**
 * @file HeartRateProcessor.h
 * @brief Adaptive peak detection for Heart Rate.
 */
#ifndef HEART_RATE_PROCESSOR_H
#define HEART_RATE_PROCESSOR_H

#include <stdint.h>

namespace HealthKiosk {
namespace Algorithms {

    class HeartRateProcessor {
    private:
        float _sum;
        int _sampleCount;
        float _bpmEMA;

    public:
        HeartRateProcessor();

        void reset();
        bool processSample(float instantBPM, unsigned long currentTimeMs);
        float getAverageHR() const;
    };

} // namespace Algorithms
} // namespace HealthKiosk

#endif // HEART_RATE_PROCESSOR_H
