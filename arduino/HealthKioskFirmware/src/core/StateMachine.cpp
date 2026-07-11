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
                     HAL::IHardwareModule* h3, HAL::IHardwareModule* h4) 
        : _currentState(SystemState::BOOT), _manager(manager), _pendingCommand(SerialComm::CommandType::UNKNOWN) {
        
        _hals[0] = h1;
        _hals[1] = h2;
        _hals[2] = h3;
        _hals[3] = h4;
        _numHals = 4;
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
        bool allPass = true;
        const char* sensorNames[] = {"MLX90614", "HX711", "TF-Luna", "MAX30102"};

        for(int i=0; i<_numHals; i++) {
            if (_hals[i]) {
                bool initPass = _hals[i]->initialize();
                bool testPass = false;
                if (initPass) {
                    testPass = _hals[i]->selfTest();
                }
                bool pass = initPass && testPass;
                if (!pass) {
                    allPass = false;
                }

                JsonDocument doc;
                doc["sensor"] = sensorNames[i];
                if (pass) {
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
        
        char buf[256];
        if (allPass) {
            SerialComm::JsonSerializer::serializeInfo("SELF_TEST", "PASSED", buf, sizeof(buf));
            _currentState = SystemState::READY;
        } else {
            SerialComm::JsonSerializer::serializeError("SELF_TEST", "Hardware initialization failed", buf, sizeof(buf));
            _currentState = SystemState::ERROR_STATE;
        }
        Serial.println(buf);
    }

    void StateMachine::processCommand(SerialComm::CommandType cmd) {
        char buf[256];
        switch (cmd) {
            case SerialComm::CommandType::CMD_PING:
                SerialComm::JsonSerializer::serializeInfo("PONG", "Alive", buf, sizeof(buf));
                Serial.println(buf);
                break;
            case SerialComm::CommandType::GET_VERSION:
                SerialComm::JsonSerializer::serializeInfo("VERSION", Config::FW_VERSION, buf, sizeof(buf));
                Serial.println(buf);
                break;
            case SerialComm::CommandType::START_TEMPERATURE:
                if (_manager->startMeasurement(ActiveSensor::TEMPERATURE)) _currentState = SystemState::MEASURE;
                else {
                    SerialComm::JsonSerializer::serializeError("BUSY", "Measurement in progress", buf, sizeof(buf));
                    Serial.println(buf);
                }
                break;
            case SerialComm::CommandType::START_WEIGHT:
                if (_manager->startMeasurement(ActiveSensor::WEIGHT)) _currentState = SystemState::MEASURE;
                else {
                    SerialComm::JsonSerializer::serializeError("BUSY", "Measurement in progress", buf, sizeof(buf));
                    Serial.println(buf);
                }
                break;
            case SerialComm::CommandType::START_HEIGHT:
                if (_manager->startMeasurement(ActiveSensor::HEIGHT)) _currentState = SystemState::MEASURE;
                else {
                    SerialComm::JsonSerializer::serializeError("BUSY", "Measurement in progress", buf, sizeof(buf));
                    Serial.println(buf);
                }
                break;
            case SerialComm::CommandType::START_HEART:
                if (_manager->startMeasurement(ActiveSensor::HEART)) _currentState = SystemState::MEASURE;
                else {
                    SerialComm::JsonSerializer::serializeError("BUSY", "Measurement in progress", buf, sizeof(buf));
                    Serial.println(buf);
                }
                break;
            case SerialComm::CommandType::UNKNOWN:
            default:
                break;
        }
    }

    void StateMachine::performRecovery(ErrorCode err) {
        char buf[256];
        SerialComm::JsonSerializer::serializeError("MEASUREMENT_FAILED", "A recovery attempt was logged.", buf, sizeof(buf));
        Serial.println(buf);
        _currentState = SystemState::READY;
    }

    void StateMachine::update() {
        while (Serial.available() > 0) {
            char c = Serial.read();
            SerialComm::CommandType cmd = _parser.processChar(c);
            if (cmd != SerialComm::CommandType::UNKNOWN) {
                if (_currentState == SystemState::READY || _currentState == SystemState::WAIT_COMMAND) {
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
                    case ActiveSensor::HEART: sensorName = "HEART"; break;
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
                break;
        }
    }

    SystemState StateMachine::getState() const {
        return _currentState;
    }

} // namespace Core
} // namespace HealthKiosk
