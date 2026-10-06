/**
 * @file WeightMeasurement.h
 */
#ifndef WEIGHT_MEASUREMENT_H
#define WEIGHT_MEASUREMENT_H

#include "../hal/HALWeight.h"
#include "../models/MeasurementResult.h"
#include "../utils/CircularBuffer.h"
#include "MeasurementState.h"
#include "../config/SensorProfiles.h"

namespace HealthKiosk {
namespace Modules {

    class WeightMeasurement {
    private:
        HAL::HALWeight* _hal;
        MeasureState _state;
        unsigned long _startTime;
        unsigned long _lastSampleTime;
        
        Models::MeasurementResult _result;
        
        Utils::CircularBuffer<float, Config::Profiles::WEIGHT_SAMPLE_COUNT> _buffer;
        
        float _currentEMA;
        float _lastW;
        unsigned int _stableCount;
        unsigned long _countdownStart;

    public:
        WeightMeasurement(HAL::HALWeight* hal);
        
        void start();
        void update();
        MeasureState getState() const;
        Models::MeasurementResult getResult() const;
    };

} // namespace Modules
} // namespace HealthKiosk

#endif // WEIGHT_MEASUREMENT_H
