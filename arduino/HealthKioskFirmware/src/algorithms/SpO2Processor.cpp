/**
 * @file SpO2Processor.cpp
 */
#include "SpO2Processor.h"
#include "Filters.h"

namespace HealthKiosk {
namespace Algorithms {

    SpO2Processor::SpO2Processor() {
        reset();
    }

    void SpO2Processor::reset() {
        _sum = 0;
        _sampleCount = 0;
        _spo2EMA = 0;
    }

    bool SpO2Processor::processSample(float computedSpO2) {
        if (computedSpO2 > 50 && computedSpO2 <= 100) {
            _sum += computedSpO2;
            _sampleCount++;

            if (_spo2EMA == 0) {
                _spo2EMA = computedSpO2;
            } else {
                _spo2EMA = Filters::computeEMA(computedSpO2, _spo2EMA, 0.2f); // Simple smoothing
            }
            return true;
        }
        return false;
    }

    float SpO2Processor::getAverageSpO2() const {
        if (_sampleCount == 0) return 0;
        return _spo2EMA;
    }

} // namespace Algorithms
} // namespace HealthKiosk
