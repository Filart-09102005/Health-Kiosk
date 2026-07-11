/**
 * @file HeartRateProcessor.cpp
 */
#include "HeartRateProcessor.h"
#include "Filters.h"

namespace HealthKiosk {
namespace Algorithms {

    HeartRateProcessor::HeartRateProcessor() {
        reset();
    }

    void HeartRateProcessor::reset() {
        _sum = 0;
        _sampleCount = 0;
        _bpmEMA = 0;
    }

    bool HeartRateProcessor::processSample(float instantBPM, unsigned long currentTimeMs) {
        if (instantBPM > 20 && instantBPM < 255) {
            _sum += instantBPM;
            _sampleCount++;

            if (_bpmEMA == 0) {
                _bpmEMA = instantBPM;
            } else {
                _bpmEMA = Filters::computeEMA(instantBPM, _bpmEMA, 0.2f);
            }
            return true;
        }
        return false;
    }

    float HeartRateProcessor::getAverageHR() const {
        if (_sampleCount == 0) return 0;
        return _bpmEMA;
    }

} // namespace Algorithms
} // namespace HealthKiosk
