/**
 * @file StateMachine.cpp
 */
#include "StateMachine.h"
#include "../serial/JsonSerializer.h"
#include "../config/Version.h"
#include <Arduino.h>

namespace HealthKiosk {
namespace Core {

    StateMachine::StateMachine(MeasurementManager* manager,
                     HAL::IHardwareModule* h1, HAL::IHardwareModule* h2,
                     HAL::IHardwareModule* h3)
        : _currentState(SystemState::BOOT), _manager(manager), _pendingCommand(SerialComm::CommandType::UNKNOWN) {

        _hals[0] = h1;
        _hals[1] = h2;
        _hals[2] = h3;
        _numHals = 3;
        for (int i = 0; i < 3; i++) _sensorOk[i] = false;
    }

    void StateMachine::begin() {
        Serial.begin(115200);
        while(!Serial) {;}
        
        char buf[256];
        SerialComm::JsonSerializer::serializeInfo("BOOT", "Kiosk Firmware Starting", buf, sizeof(buf));
        Serial.println(buf);
        
        _currentState = SystemState::SELF_TEST;
    }

    static const char* errorCodeToString(ErrorCode code) {
        switch (code) {
            case ErrorCode::OK: return "OK";
            case ErrorCode::SENSOR_TIMEOUT: return "SENSOR_TIMEOUT";
            case ErrorCode::SENSOR_DISCONNECTED: return "SENSOR_DISCONNECTED";
            case ErrorCode::SENSOR_NOT_STABLE: return "SENSOR_NOT_STABLE";
            case ErrorCode::SENSOR_OUT_OF_RANGE: return "SENSOR_OUT_OF_RANGE";
            case ErrorCode::CALIBRATION_REQUIRED: return "CALIBRATION_REQUIRED";
            default: return "UNKNOWN_ERROR";
        }
    }

    void StateMachine::handleSelfTest() {
        const char* sensorNames[] = {"MLX90614", "HX711", "TF-Luna"};

        for(int i=0; i<_numHals; i++) {
            if (_hals[i]) {
                bool initPass = _hals[i]->initialize();
                bool testPass = false;
                if (initPass) {
                    testPass = _hals[i]->selfTest();
                }
                _sensorOk[i] = initPass && testPass;

                JsonDocument doc;
                doc["sensor"] = sensorNames[i];
                if (_sensorOk[i]) {
                    doc["status"] = "OK";
                } else {
                    doc["status"] = "FAILED";
                    doc["error"] = errorCodeToString(_hals[i]->lastError());
                }
                char outBuf[128];
                serializeJson(doc, outBuf, sizeof(outBuf));
                Serial.println(outBuf);
            }
        }
        
        // Always proceed to READY. Individual sensor failures are handled
        // when a measurement for that specific sensor is requested.
        char buf[256];
        SerialComm::JsonSerializer::serializeInfo("SELF_TEST", "DONE", buf, sizeof(buf));
        _currentState = SystemState::READY;
        Serial.println(buf);
    }

    // Sensor index mapping: 0=TEMPERATURE(MLX90614), 1=WEIGHT(HX711), 2=HEIGHT(TF-Luna)
    static int sensorIndex(ActiveSensor s) {
        switch(s) {
            case ActiveSensor::TEMPERATURE: return 0;
            case ActiveSensor::WEIGHT: return 1;
            case ActiveSensor::HEIGHT: return 2;
            default: return -1;
        }
    }

    void StateMachine::processCommand(SerialComm::CommandType cmd) {
        char buf[256];
        switch (cmd) {
            case SerialComm::CommandType::CMD_PING:
                SerialComm::JsonSerializer::serializeInfo("PONG", "Alive", buf, sizeof(buf));
                Serial.println(buf);
                break;
            case SerialComm::CommandType::CMD_STOP:
                if (_currentState == SystemState::MEASURE || _currentState == SystemState::RESULT_READY) {
                    _manager->cancelMeasurement();
                    _currentState = SystemState::READY;
                    SerialComm::JsonSerializer::serializeInfo("STOP", "Measurement cancelled", buf, sizeof(buf));
                    Serial.println(buf);
                }
                break;
            case SerialComm::CommandType::GET_VERSION:
                SerialComm::JsonSerializer::serializeInfo("VERSION", Config::FW_VERSION, buf, sizeof(buf));
                Serial.println(buf);
                break;
            case SerialComm::CommandType::START_TEMPERATURE:
            case SerialComm::CommandType::START_WEIGHT:
            case SerialComm::CommandType::START_HEIGHT: {
                // Map command to ActiveSensor
                ActiveSensor sensor;
                if (cmd == SerialComm::CommandType::START_TEMPERATURE) sensor = ActiveSensor::TEMPERATURE;
                else if (cmd == SerialComm::CommandType::START_WEIGHT) sensor = ActiveSensor::WEIGHT;
                else sensor = ActiveSensor::HEIGHT;

                int idx = sensorIndex(sensor);

                // A sensor that failed self-test at boot (e.g. TF-Luna still
                // warming up) may well be ready now — retry once before
                // permanently refusing it for the rest of the session.
                if (idx >= 0 && !_sensorOk[idx] && _hals[idx]) {
                    _sensorOk[idx] = _hals[idx]->initialize() && _hals[idx]->selfTest();
                }

                if (idx >= 0 && !_sensorOk[idx]) {
                    SerialComm::JsonSerializer::serializeError("SENSOR_NOT_DETECTED", "Sensor hardware not detected. Check wiring.", buf, sizeof(buf));
                    Serial.println(buf);
                } else if (_manager->startMeasurement(sensor)) {
                    _currentState = SystemState::MEASURE;
                } else {
                    SerialComm::JsonSerializer::serializeError("BUSY", "Measurement in progress", buf, sizeof(buf));
                    Serial.println(buf);
                }
                break;
            }
            case SerialComm::CommandType::UNKNOWN:
            default:
                break;
        }
    }

    void StateMachine::performRecovery(ErrorCode err) {
        // Measurement error payload is already sent in SEND state.
        // We just reset internal state.
        _currentState = SystemState::READY;
    }

    void StateMachine::update() {
        // Process serial commands in ALL states (GET_VERSION, PING always work)
        while (Serial.available() > 0) {
            char c = Serial.read();
            SerialComm::CommandType cmd = _parser.processChar(c);
            if (cmd != SerialComm::CommandType::UNKNOWN) {
                // GET_VERSION, PING, and STOP are always allowed
                if (cmd == SerialComm::CommandType::GET_VERSION || cmd == SerialComm::CommandType::CMD_PING || cmd == SerialComm::CommandType::CMD_STOP) {
                    processCommand(cmd);
                } else if (_currentState == SystemState::READY || _currentState == SystemState::WAIT_COMMAND) {
                    processCommand(cmd);
                } else if (_currentState == SystemState::MEASURE) {
                    char buf[256];
                    SerialComm::JsonSerializer::serializeError("BUSY", "Another measurement is active", buf, sizeof(buf));
                    Serial.println(buf);
                }
            }
        }

        switch (_currentState) {
            case SystemState::BOOT:
                begin();
                break;
                
            case SystemState::SELF_TEST:
                handleSelfTest();
                break;
                
            case SystemState::READY:
            case SystemState::WAIT_COMMAND:
                break;
                
            case SystemState::MEASURE:
                _manager->update();
                if (_manager->isFinished()) {
                    _currentState = SystemState::RESULT_READY;
                } else {
                    if (millis() - _lastLiveUpdate > 500) {
                        _lastLiveUpdate = millis();
                        char buf[512];
                        Models::MeasurementResult currentRes = _manager->getCurrentResult();
                        const char* sensorName = "UNKNOWN";
                        switch (_manager->getActiveSensor()) {
                            case ActiveSensor::TEMPERATURE: sensorName = "TEMPERATURE"; break;
                            case ActiveSensor::WEIGHT: sensorName = "WEIGHT"; break;
                            case ActiveSensor::HEIGHT: sensorName = "HEIGHT"; break;
                            default: break;
                        }
                        const char* machineStateStr = "WAITING";
                        Modules::MeasureState modState = _manager->getActiveModuleState();
                        switch (modState) {
                            case Modules::MeasureState::INITIALIZE: 
                            case Modules::MeasureState::WAITING:
                                machineStateStr = "WAITING"; 
                                break;
                            case Modules::MeasureState::VALIDATING:
                                machineStateStr = "VALIDATING";
                                break;
                            case Modules::MeasureState::READY:
                                machineStateStr = "READY";
                                break;
                            case Modules::MeasureState::COUNTDOWN:
                                machineStateStr = "COUNTDOWN";
                                break;
                            case Modules::MeasureState::COLLECTING:
                                machineStateStr = "COLLECTING";
                                break;
                            case Modules::MeasureState::PROCESSING:
                                machineStateStr = "PROCESSING";
                                break;
                            case Modules::MeasureState::COMPLETE:
                                machineStateStr = "COMPLETE";
                                break;
                            case Modules::MeasureState::FAILED:
                                machineStateStr = "FAILED";
                                break;
                            case Modules::MeasureState::ERROR:
                                machineStateStr = "ERROR";
                                break;
                            default:
                                machineStateStr = "IDLE";
                                break;
                        }
                        SerialComm::JsonSerializer::serializeLiveMeasurement(sensorName, machineStateStr, currentRes, buf, sizeof(buf));
                        Serial.println(buf);
                    }
                }
                break;
                
            case SystemState::RESULT_READY:
                _currentState = SystemState::SEND;
                break;
                
            case SystemState::SEND: {
                char buf[512];
                Models::MeasurementResult res = _manager->getResult();
                
                const char* sensorName = "UNKNOWN";
                switch (_manager->getActiveSensor()) {
                    case ActiveSensor::TEMPERATURE: sensorName = "TEMPERATURE"; break;
                    case ActiveSensor::WEIGHT: sensorName = "WEIGHT"; break;
                    case ActiveSensor::HEIGHT: sensorName = "HEIGHT"; break;
                    default: break;
                }
                
                if (res.error == ErrorCode::OK) {
                    SerialComm::JsonSerializer::serializeMeasurement(sensorName, res, buf, sizeof(buf));
                } else {
                    SerialComm::JsonSerializer::serializeMeasurement(sensorName, res, buf, sizeof(buf));
                    performRecovery(res.error);
                }
                
                Serial.println(buf);
                _manager->cancelMeasurement();
                _currentState = SystemState::READY;
                break;
            }
                
            case SystemState::ERROR_STATE:
                // Non-blocking: just go back to READY
                _currentState = SystemState::READY;
                break;
        }
    }

    SystemState StateMachine::getState() const {
        return _currentState;
    }

} // namespace Core
} // namespace HealthKiosk
