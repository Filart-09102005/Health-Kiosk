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
        Models::MeasurementResult _result;
        
        unsigned long _startTime;
        Utils::CircularBuffer<float, Config::Profiles::WEIGHT_SAMPLE_COUNT> _buffer;
        
        float _currentEMA;
        unsigned int _stableCount;

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
