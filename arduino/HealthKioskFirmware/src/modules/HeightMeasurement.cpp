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
        _startTime = millis();
        _result = Models::MeasurementResult();
    }

    void HeightMeasurement::update() {
        if (_state == MeasureState::IDLE || _state == MeasureState::COMPLETE || _state == MeasureState::ERROR) return;

        if (millis() - _startTime > Config::Profiles::HEIGHT_TIMEOUT_MS) {
            _result.error = ErrorCode::SENSOR_TIMEOUT;
            _state = MeasureState::ERROR;
            return;
        }

        switch (_state) {
            case MeasureState::INITIALIZE:
                if (_hal->isReady() || _hal->initialize()) {
                    _state = MeasureState::WAIT_FOR_SENSOR;
                } else {
                    _result.error = _hal->lastError();
                    _state = MeasureState::ERROR;
                }
                break;

            case MeasureState::WAIT_FOR_SENSOR:
                if (_hal->selfTest()) {
                    _state = MeasureState::COLLECT_SAMPLES;
                } else {
                    _result.error = _hal->lastError();
                    _state = MeasureState::ERROR;
                }
                break;

            case MeasureState::COLLECT_SAMPLES: {
                float h = 0;
                if (_hal->acquire(h)) {
                    if (_buffer.isEmpty()) _currentEMA = h;
                    _currentEMA = Algorithms::Filters::computeEMA(h, _currentEMA, 0.4f); 
                    _buffer.push(_currentEMA);
                    
                    if (_buffer.isFull()) {
                        _state = MeasureState::FILTER;
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

            case MeasureState::FILTER: {
                size_t size = _buffer.capacity();
                float data[Config::Profiles::HEIGHT_SAMPLE_COUNT];
                float workBuffer[Config::Profiles::HEIGHT_SAMPLE_COUNT];
                
                for(size_t i=0; i<size; i++) data[i] = _buffer.peek(i);
                
                float median = Algorithms::Filters::computeMedian(data, size);
                float mad = Algorithms::Filters::computeMAD(data, size, median, workBuffer);
                
                float sum = 0;
                int count = 0;
                float mad_bound = 3.0f * mad;
                if (mad_bound < 1.0f) mad_bound = 1.0f; 
                
                for(size_t i=0; i<size; i++) {
                    float val = _buffer.peek(i);
                    if (Utils::MathUtils::absolute(val - median) <= mad_bound) {
                        sum += val;
                        count++;
                    }
                }
                
                float avg = (count > 0) ? (sum / count) : median;
                _result.value = avg;
                _result.stabilityScore = mad;
                _result.sampleCount = count;
                
                _state = MeasureState::STABILITY_CHECK;
                break;
            }

            case MeasureState::STABILITY_CHECK:
                if (_result.stabilityScore <= Config::Profiles::HEIGHT_STABLE_THRESHOLD) {
                    _stableCount++;
                    if (_stableCount >= 5) {
                        _state = MeasureState::CONFIDENCE_CHECK;
                    } else {
                        float dummy;
                        _buffer.pop(dummy);
                        _state = MeasureState::COLLECT_SAMPLES;
                    }
                } else {
                    _stableCount = 0;
                    float dummy;
                    _buffer.pop(dummy);
                    _state = MeasureState::COLLECT_SAMPLES;
                }
                break;

            case MeasureState::CONFIDENCE_CHECK: {
                float conf = Algorithms::SignalQuality::computeConfidence(_result.stabilityScore, 0.5f, 3.0f);
                _result.confidence = conf * 100.0f;
                
                if (_result.confidence < 50.0f) {
                    _result.error = ErrorCode::SENSOR_NOT_STABLE;
                    _state = MeasureState::ERROR;
                } else {
                    _state = MeasureState::CALIBRATION;
                }
                break;
            }

            case MeasureState::CALIBRATION:
                _result.value = Algorithms::Calibration::applyLinear(_result.value, 1.0f, 0.0f);
                _state = MeasureState::VALIDATION;
                break;

            case MeasureState::VALIDATION:
                if (!isfinite(_result.value) || 
                    _result.value < Config::Profiles::HEIGHT_MIN_VALID || 
                    _result.value > Config::Profiles::HEIGHT_MAX_VALID) {
                    _result.error = ErrorCode::SENSOR_OUT_OF_RANGE;
                    _state = MeasureState::ERROR;
                } else {
                    _result.measurementTime = millis() - _startTime;
                    _result.timestamp = millis();
                    _state = MeasureState::COMPLETE;
                }
                break;

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
