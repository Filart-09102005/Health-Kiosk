/**
 * @file WeightMeasurement.cpp
 */
#include "WeightMeasurement.h"
#include "../algorithms/Filters.h"
#include "../algorithms/Statistics.h"
#include "../algorithms/SignalQuality.h"
#include "../algorithms/Calibration.h"
#include "../config/SensorProfiles.h"
#include "../config/ErrorCodes.h"
#include "../utils/MathUtils.h"
#include <math.h>
#include <Arduino.h>

namespace HealthKiosk {
namespace Modules {

    WeightMeasurement::WeightMeasurement(HAL::HALWeight* hal) 
        : _hal(hal), _state(MeasureState::IDLE), _currentEMA(0.0f), _stableCount(0) {
    }

    void WeightMeasurement::start() {
        _state = MeasureState::INITIALIZE;
        _buffer.clear();
        _currentEMA = 0.0f;
        _lastW = 0.0f;
        _countdownStart = 0;
        _stableCount = 0;
        _startTime = millis();
        _result = Models::MeasurementResult();
    }

    void WeightMeasurement::update() {
        if (_state == MeasureState::IDLE || _state == MeasureState::COMPLETE || _state == MeasureState::ERROR || _state == MeasureState::FAILED) return;

        if (millis() - _startTime > Config::Profiles::WEIGHT_TIMEOUT_MS) {
            _result.error = ErrorCode::SENSOR_TIMEOUT;
            _state = MeasureState::ERROR;
            return;
        }

        switch (_state) {
            case MeasureState::INITIALIZE:
                if (_hal->isReady() || _hal->initialize()) {
                    _state = MeasureState::WAITING;
                } else {
                    _result.error = _hal->lastError();
                    _state = MeasureState::ERROR;
                }
                break;

            case MeasureState::WAITING: {
                float w;
                if (_hal->acquire(w)) {
                    _result.value = w; // Send live weight for display
                    if (w > 5.0f && w < 500.0f) { // Person is on it
                        _state = MeasureState::VALIDATING;
                        _stableCount = 0;
                        _lastW = w;
                    }
                }
                break;
            }

            case MeasureState::VALIDATING: {
                float w;
                if (_hal->acquire(w)) {
                    _result.value = w;
                    if (w < 5.0f || w > 500.0f) {
                        _state = MeasureState::WAITING; // User got off
                    } else {
                        // Very basic stability check: if difference between current and last is < 0.5kg
                        if (Utils::MathUtils::absolute(w - _lastW) < 0.5f) {
                            _stableCount++;
                            if (_stableCount > 5) {
                                _state = MeasureState::READY;
                            }
                        } else {
                            _stableCount = 0;
                        }
                        _lastW = w;
                    }
                }
                break;
            }

            case MeasureState::READY:
                _countdownStart = millis();
                _state = MeasureState::COUNTDOWN;
                break;

            case MeasureState::COUNTDOWN: {
                float w;
                if (millis() - _countdownStart > 2000) {
                    _state = MeasureState::COLLECTING;
                    _buffer.clear();
                }
                // live weight update
                if (_hal->acquire(w)) { 
                    _result.value = w; 
                    if (w < 5.0f || w > 500.0f) {
                        _state = MeasureState::WAITING; // Abort countdown
                    }
                }
                break;
            }

            case MeasureState::COLLECTING: {
                float w = 0;
                if (_hal->acquire(w)) {
                    if (w < 5.0f || w > 500.0f) {
                        _state = MeasureState::FAILED; // Failed because user got off during measurement
                        _result.error = ErrorCode::SENSOR_NOT_STABLE;
                        break;
                    }
                    if (_buffer.isEmpty()) _currentEMA = w;
                    _currentEMA = Algorithms::Filters::computeEMA(w, _currentEMA, 0.2f);
                    _buffer.push(_currentEMA);
                    _result.value = _currentEMA;
                    
                    if (_buffer.isFull()) {
                        _state = MeasureState::PROCESSING;
                    }
                } else {
                    ErrorCode err = _hal->lastError();
                    if (err != ErrorCode::OK && err != ErrorCode::SENSOR_TIMEOUT) {
                        _result.error = err;
                        _state = MeasureState::ERROR;
                    }
                }
                break;
            }

            case MeasureState::PROCESSING: {
                size_t size = _buffer.capacity();
                float data[Config::Profiles::WEIGHT_SAMPLE_COUNT];
                for(size_t i=0; i<size; i++) data[i] = _buffer.peek(i);
                
                float median = Algorithms::Filters::computeMedian(data, size);
                
                // Reject impossible spikes
                if (median <= 0.0f || median > 500.0f) {
                    _state = MeasureState::FAILED;
                    _result.error = ErrorCode::SENSOR_OUT_OF_RANGE;
                    break;
                }
                
                _result.value = median;
                _result.measurementTime = millis() - _startTime;
                _result.timestamp = millis();
                _state = MeasureState::COMPLETE;
                break;
            }

            default:
                break;
        }
    }

    MeasureState WeightMeasurement::getState() const {
        return _state;
    }

    Models::MeasurementResult WeightMeasurement::getResult() const {
        return _result;
    }

} // namespace Modules
} // namespace HealthKiosk
