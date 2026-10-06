/**
 * @file HeightMeasurement.cpp
 */
#include "HeightMeasurement.h"
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

    HeightMeasurement::HeightMeasurement(HAL::HALHeight* hal) 
        : _hal(hal), _state(MeasureState::IDLE), _currentEMA(0.0f), _stableCount(0) {
    }

    void HeightMeasurement::start() {
        _state = MeasureState::INITIALIZE;
        _buffer.clear();
        _currentEMA = 0.0f;
        _stableCount = 0;
        _countdownStart = 0;
        _startTime = millis();
        _result = Models::MeasurementResult();
    }

    void HeightMeasurement::update() {
        if (_state == MeasureState::IDLE || _state == MeasureState::COMPLETE || _state == MeasureState::ERROR || _state == MeasureState::FAILED) return;

        if (millis() - _startTime > Config::Profiles::HEIGHT_TIMEOUT_MS) {
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
                float h = 0;
                if (_hal->acquire(h)) {
                    _result.value = h;
                    // If height > 50cm, assume someone is standing there
                    if (h > 50.0f && h < 220.0f) {
                        _state = MeasureState::VALIDATING;
                        _stableCount = 0;
                    }
                }
                break;
            }

            case MeasureState::VALIDATING: {
                float h = 0;
                if (_hal->acquire(h)) {
                    _result.value = h;
                    if (h < 50.0f || h > 220.0f) {
                        _state = MeasureState::WAITING; // User moved away
                        break;
                    }
                    // Basic stability check
                    if (Utils::MathUtils::absolute(h - _currentEMA) < 2.0f) {
                        _stableCount++;
                        if (_stableCount > 10) {
                            _state = MeasureState::READY;
                        }
                    } else {
                        _stableCount = 0;
                    }
                    _currentEMA = h;
                }
                break;
            }
            
            case MeasureState::READY:
                _countdownStart = millis();
                _state = MeasureState::COUNTDOWN;
                break;
                
            case MeasureState::COUNTDOWN: {
                float h = 0;
                if (_hal->acquire(h)) {
                    _result.value = h;
                    if (h < 50.0f || h > 220.0f) {
                        _state = MeasureState::WAITING; // User moved away
                        return;
                    }
                }
                if (millis() - _countdownStart > 2000) {
                    _state = MeasureState::COLLECTING;
                    _buffer.clear();
                }
                break;
            }

            case MeasureState::COLLECTING: {
                float h = 0;
                if (_hal->acquire(h)) {
                    if (h < 50.0f || h > 220.0f) {
                        _state = MeasureState::FAILED;
                        _result.error = ErrorCode::SENSOR_NOT_STABLE;
                        break;
                    }
                    _buffer.push(h);
                    _result.value = h;
                    
                    if (_buffer.isFull()) {
                        _state = MeasureState::PROCESSING;
                    }
                }
                break;
            }
            
            case MeasureState::PROCESSING: {
                float sum = 0;
                float minVal = _buffer.peek(0);
                float maxVal = _buffer.peek(0);
                
                for (size_t i = 0; i < _buffer.getCount(); i++) {
                    float val = _buffer.peek(i);
                    sum += val;
                    if (val < minVal) minVal = val;
                    if (val > maxVal) maxVal = val;
                }
                
                float avg = sum / _buffer.getCount();
                
                _result.value = avg;
                _result.measurementTime = millis() - _startTime;
                _result.timestamp = millis();
                _state = MeasureState::COMPLETE;
                break;
            }

            default:
                break;
        }
    }

    MeasureState HeightMeasurement::getState() const {
        return _state;
    }

    Models::MeasurementResult HeightMeasurement::getResult() const {
        return _result;
    }

} // namespace Modules
} // namespace HealthKiosk
