/**
 * @file SpO2Processor.h
 * @brief SpO2 estimator using AC/DC ratio.
 */
#ifndef SPO2_PROCESSOR_H
#define SPO2_PROCESSOR_H

#include <stdint.h>

namespace HealthKiosk {
namespace Algorithms {

    class SpO2Processor {
    private:
        float _sum;
        int _sampleCount;
        float _spo2EMA;

    public:
        SpO2Processor();

        void reset();
        
        // Takes the computed SpO2 from the Maxim algorithm and averages it
        bool processSample(float computedSpO2);
        
        float getAverageSpO2() const;
    };

} // namespace Algorithms
} // namespace HealthKiosk

#endif // SPO2_PROCESSOR_H
