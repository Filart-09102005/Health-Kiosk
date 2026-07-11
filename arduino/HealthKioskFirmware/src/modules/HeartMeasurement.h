/**
 * @file HeartMeasurement.h
 */
#ifndef HEART_MEASUREMENT_H
#define HEART_MEASUREMENT_H

#include "../hal/HALHeart.h"
#include "../models/MeasurementResult.h"
#include "MeasurementState.h"
#include "../algorithms/HeartRateProcessor.h"
#include "../algorithms/SpO2Processor.h"
#include <spo2_algorithm.h> // Official Maxim algorithm

namespace HealthKiosk {
namespace Modules {

    class HeartMeasurement {
    private:
        HAL::HALHeart* _hal;
        MeasureState _state;
        Models::MeasurementResult _result;
        
        unsigned long _startTime;
        
        static const int HEART_BUFFER_SIZE = 100;
        
        uint32_t _irBuffer[HEART_BUFFER_SIZE];
        uint32_t _redBuffer[HEART_BUFFER_SIZE];
        int _samplesCollected;
        unsigned int _stableCount;
        
        int32_t _rawHR;
        int32_t _rawSpO2;
        bool _rawHrValid;
        bool _rawSpo2Valid;

        Algorithms::HeartRateProcessor _hrProcessor;
        Algorithms::SpO2Processor _spo2Processor;

    public:
        HeartMeasurement(HAL::HALHeart* hal);
        
        void start();
        void update();
        MeasureState getState() const;
        Models::MeasurementResult getResult() const;
        
        // Diagnostic accessors for Validation Mode
        int32_t getRawHR() const { return _rawHR; }
        int32_t getRawSpO2() const { return _rawSpO2; }
        bool isRawHrValid() const { return _rawHrValid; }
        bool isRawSpo2Valid() const { return _rawSpo2Valid; }
        uint32_t getLatestIR() const { return _irBuffer[_samplesCollected > 0 ? _samplesCollected - 1 : 0]; }
        uint32_t getLatestRed() const { return _redBuffer[_samplesCollected > 0 ? _samplesCollected - 1 : 0]; }
    };

} // namespace Modules
} // namespace HealthKiosk

#endif // HEART_MEASUREMENT_H
