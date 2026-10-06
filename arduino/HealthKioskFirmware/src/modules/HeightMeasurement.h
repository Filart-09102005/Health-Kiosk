/**
 * @file HeightMeasurement.h
 */
#ifndef HEIGHT_MEASUREMENT_H
#define HEIGHT_MEASUREMENT_H

#include "../hal/HALHeight.h"
#include "../models/MeasurementResult.h"
#include "../utils/CircularBuffer.h"
#include "MeasurementState.h"
#include "../config/SensorProfiles.h"

namespace HealthKiosk {
namespace Modules {

    class HeightMeasurement {
    private:
        HAL::HALHeight* _hal;
        unsigned long _startTime;
        unsigned long _lastSampleTime;
        
        MeasureState _state;
        Models::MeasurementResult _result;
        
        Utils::CircularBuffer<float, Config::Profiles::HEIGHT_SAMPLE_COUNT> _buffer;
        
        float _currentEMA;
        unsigned int _stableCount;
        unsigned long _countdownStart;

    public:
        HeightMeasurement(HAL::HALHeight* hal);
        
        void start();
        void update();
        MeasureState getState() const;
        Models::MeasurementResult getResult() const;
    };

} // namespace Modules
} // namespace HealthKiosk

#endif // HEIGHT_MEASUREMENT_H
