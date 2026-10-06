/**
 * @file TemperatureMeasurement.h
 * @brief Temperature measurement state machine.
 * 
 * Dependencies: HALTemperature, MeasurementResult, CircularBuffer, MeasurementState
 */

#ifndef TEMPERATURE_MEASUREMENT_H
#define TEMPERATURE_MEASUREMENT_H

#include "../hal/HALTemperature.h"
#include "../models/MeasurementResult.h"
#include "../utils/CircularBuffer.h"
#include "MeasurementState.h"
#include "../config/SensorProfiles.h"

namespace HealthKiosk {
namespace Modules {

    class TemperatureMeasurement {
    private:
        HAL::HALTemperature* _hal;
        unsigned long _startTime;
        unsigned long _lastSampleTime;
        
        MeasureState _state;
        Models::MeasurementResult _result;
        
        Utils::CircularBuffer<float, Config::Profiles::TEMP_SAMPLE_COUNT> _buffer;
        
        float _currentEMA;
        unsigned long _stableSince;
        unsigned long _countdownStart;

    public:
        TemperatureMeasurement(HAL::HALTemperature* hal);
        
        void start();
        void update();
        MeasureState getState() const;
        Models::MeasurementResult getResult() const;
    };

} // namespace Modules
} // namespace HealthKiosk

#endif // TEMPERATURE_MEASUREMENT_H
