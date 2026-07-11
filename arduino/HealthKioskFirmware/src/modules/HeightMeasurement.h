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
        MeasureState _state;
        Models::MeasurementResult _result;
        
        unsigned long _startTime;
        Utils::CircularBuffer<float, Config::Profiles::HEIGHT_SAMPLE_COUNT> _buffer;
        
        float _currentEMA;
        unsigned int _stableCount;

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
