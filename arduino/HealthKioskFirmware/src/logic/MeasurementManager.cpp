/**
 * @file MeasurementManager.cpp
 */
#include "MeasurementManager.h"
#include "../modules/MeasurementState.h"

namespace HealthKiosk {
namespace Core {

    MeasurementManager::MeasurementManager(
        Modules::TemperatureMeasurement* tempModule,
        Modules::WeightMeasurement* weightModule,
        Modules::HeightMeasurement* heightModule
    ) : _tempModule(tempModule), _weightModule(weightModule),
        _heightModule(heightModule),
        _activeSensor(ActiveSensor::NONE), _isFinished(false) {
    }

    bool MeasurementManager::startMeasurement(ActiveSensor sensor) {
        if (isBusy()) return false; 
        
        _activeSensor = sensor;
        _isFinished = false;
        
        switch (sensor) {
            case ActiveSensor::TEMPERATURE: _tempModule->start(); break;
            case ActiveSensor::WEIGHT: _weightModule->start(); break;
            case ActiveSensor::HEIGHT: _heightModule->start(); break;
            default: return false;
        }
        return true;
    }

    void MeasurementManager::update() {
        if (_activeSensor == ActiveSensor::NONE || _isFinished) return;

        Modules::MeasureState state;
        
        switch (_activeSensor) {
            case ActiveSensor::TEMPERATURE:
                _tempModule->update();
                state = _tempModule->getState();
                if (state == Modules::MeasureState::COMPLETE || state == Modules::MeasureState::ERROR || state == Modules::MeasureState::FAILED) {
                    _lastResult = _tempModule->getResult();
                    _isFinished = true;
                }
                break;
                
            case ActiveSensor::WEIGHT:
                _weightModule->update();
                state = _weightModule->getState();
                if (state == Modules::MeasureState::COMPLETE || state == Modules::MeasureState::ERROR || state == Modules::MeasureState::FAILED) {
                    _lastResult = _weightModule->getResult();
                    _isFinished = true;
                }
                break;
                
            case ActiveSensor::HEIGHT:
                _heightModule->update();
                state = _heightModule->getState();
                if (state == Modules::MeasureState::COMPLETE || state == Modules::MeasureState::ERROR || state == Modules::MeasureState::FAILED) {
                    _lastResult = _heightModule->getResult();
                    _isFinished = true;
                }
                break;
                
            default:
                break;
        }
    }

    bool MeasurementManager::isBusy() const {
        return _activeSensor != ActiveSensor::NONE && !_isFinished;
    }

    bool MeasurementManager::isFinished() const {
        return _isFinished;
    }

    Models::MeasurementResult MeasurementManager::getResult() const {
        return _lastResult;
    }

    Models::MeasurementResult MeasurementManager::getCurrentResult() const {
        switch (_activeSensor) {
            case ActiveSensor::TEMPERATURE: return _tempModule->getResult();
            case ActiveSensor::WEIGHT: return _weightModule->getResult();
            case ActiveSensor::HEIGHT: return _heightModule->getResult();
            default: return Models::MeasurementResult();
        }
    }

    ActiveSensor MeasurementManager::getActiveSensor() const {
        return _activeSensor;
    }

    Modules::MeasureState MeasurementManager::getActiveModuleState() const {
        switch (_activeSensor) {
            case ActiveSensor::TEMPERATURE: return _tempModule->getState();
            case ActiveSensor::WEIGHT: return _weightModule->getState();
            case ActiveSensor::HEIGHT: return _heightModule->getState();
            default: return Modules::MeasureState::IDLE;
        }
    }

    void MeasurementManager::cancelMeasurement() {
        _activeSensor = ActiveSensor::NONE;
        _isFinished = false;
    }

} // namespace Core
} // namespace HealthKiosk
