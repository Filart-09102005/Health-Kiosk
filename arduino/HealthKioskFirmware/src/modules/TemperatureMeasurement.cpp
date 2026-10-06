/**
 * @file TemperatureMeasurement.cpp
 */

#include "TemperatureMeasurement.h"
#include "../algorithms/Filters.h"
#include "../algorithms/Statistics.h"
#include "../algorithms/SignalQuality.h"
#include "../algorithms/Calibration.h"
#include "../config/SensorProfiles.h"
#include "../config/ErrorCodes.h"
#include "../config/CalibrationData.h"
#include "../utils/MathUtils.h"
#include <math.h>
#include <Arduino.h>

namespace HealthKiosk {
namespace Modules {

    TemperatureMeasurement::TemperatureMeasurement(HAL::HALTemperature* hal)
        : _hal(hal), _state(MeasureState::IDLE), _currentEMA(0.0f), _stableSince(0) {
    }

    void TemperatureMeasurement::start() {
        _state = MeasureState::INITIALIZE;
        _buffer.clear();
        _currentEMA = 0.0f;
        _stableSince = 0;
        _countdownStart = 0;
        _startTime = millis();
        _result = Models::MeasurementResult();
    }

    void TemperatureMeasurement::update() {
        if (_state == MeasureState::IDLE || _state == MeasureState::COMPLETE || _state == MeasureState::ERROR || _state == MeasureState::FAILED) return;

        if (millis() - _startTime > Config::Profiles::TEMP_TIMEOUT_MS) {
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
                float obj = 0, amb = 0;
                if (_hal->acquire(obj, amb)) {
                    // Range-gating below always uses the RAW sensor value (obj) — only the
                    // reported/displayed value gets the calibration offset, so a live/early
                    // capture already matches what PROCESSING would eventually compute.
                    _result.value = obj + Config::Calibration::DEFAULT_TEMP_OFFSET;
                    // Approximation of "Distance" based on thermal gradient since no hardware distance sensor is present.
                    // If object temp is significantly higher than ambient, assume person is close.
                    if (obj > Config::Calibration::TEMP_DETECT_MIN_C && obj < Config::Calibration::TEMP_DETECT_MAX_C) {
                        _state = MeasureState::VALIDATING;
                        _stableSince = 0;
                    }
                }
                break;
            }

            case MeasureState::VALIDATING: {
                float obj = 0, amb = 0;
                if (_hal->acquire(obj, amb)) {
                    _result.value = obj + Config::Calibration::DEFAULT_TEMP_OFFSET;

                    if (obj < Config::Calibration::TEMP_DETECT_MIN_C || obj > Config::Calibration::TEMP_DETECT_MAX_C) {
                        _state = MeasureState::WAITING;
                        _stableSince = 0;
                        break;
                    }

                    // Hold-steady window, timed against the clock (not loop iterations)
                    // so it stays a consistent ~TEMP_STABILITY_MS regardless of CPU load.
                    if (Utils::MathUtils::absolute(obj - _currentEMA) < Config::Profiles::TEMP_STABLE_THRESHOLD) {
                        if (_stableSince == 0) _stableSince = millis();
                        if (millis() - _stableSince >= Config::Profiles::TEMP_STABILITY_MS) {
                            _state = MeasureState::READY;
                        }
                    } else {
                        _stableSince = 0;
                    }
                    _currentEMA = obj;
                }
                break;
            }

            case MeasureState::READY:
                _countdownStart = millis();
                _state = MeasureState::COUNTDOWN;
                break;

            case MeasureState::COUNTDOWN: {
                float obj = 0, amb = 0;
                if (_hal->acquire(obj, amb)) {
                    _result.value = obj + Config::Calibration::DEFAULT_TEMP_OFFSET;
                    if (obj < Config::Calibration::TEMP_DETECT_MIN_C || obj > Config::Calibration::TEMP_DETECT_MAX_C) {
                        _state = MeasureState::WAITING; // User moved away
                        return;
                    }
                }
                if (millis() - _countdownStart > Config::Profiles::TEMP_COUNTDOWN_MS) {
                    _state = MeasureState::COLLECTING;
                    _buffer.clear();
                }
                break;
            }

            case MeasureState::COLLECTING: {
                float obj = 0, amb = 0;
                if (_hal->acquire(obj, amb)) {
                    if (obj < Config::Calibration::TEMP_DETECT_MIN_C || obj > Config::Calibration::TEMP_DETECT_MAX_C) {
                        _state = MeasureState::FAILED;
                        _result.error = ErrorCode::SENSOR_NOT_STABLE;
                        break;
                    }
                    if (_buffer.isEmpty()) _currentEMA = obj;
                    _currentEMA = Algorithms::Filters::computeEMA(obj, _currentEMA, 0.3f);
                    _buffer.push(_currentEMA); // buffer stays RAW — PROCESSING below adds the offset once, on the median
                    _result.value = _currentEMA + Config::Calibration::DEFAULT_TEMP_OFFSET;
                    
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
                float data[Config::Profiles::TEMP_SAMPLE_COUNT];
                for(size_t i=0; i<size; i++) data[i] = _buffer.peek(i);
                
                float median = Algorithms::Filters::computeMedian(data, size);
                
                // Reject out of range
                if (median < Config::Calibration::TEMP_DETECT_MIN_C || median > Config::Calibration::TEMP_DETECT_MAX_C) {
                    _state = MeasureState::FAILED;
                    _result.error = ErrorCode::SENSOR_OUT_OF_RANGE;
                    break;
                }
                
                // Apply Calibration Offset
                median += Config::Calibration::DEFAULT_TEMP_OFFSET;
                
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

    MeasureState TemperatureMeasurement::getState() const {
        return _state;
    }

    Models::MeasurementResult TemperatureMeasurement::getResult() const {
        return _result;
    }

} // namespace Modules
} // namespace HealthKiosk
