/**
 * @file JsonSerializer.cpp
 */
#include "JsonSerializer.h"
#include "../config/Version.h"
#include <Arduino.h>

namespace HealthKiosk {
namespace SerialComm {

    unsigned long JsonSerializer::_sequenceNumber = 0;

    void JsonSerializer::serializeMeasurement(const char* sensorName, const Models::MeasurementResult& result, char* outputBuffer, size_t bufferSize) {
        _sequenceNumber++;
        JsonDocument doc;
        
        doc["protocol"] = "2.0";
        doc["firmware"] = Config::FW_VERSION;
        doc["type"] = "measurement";
        doc["timestamp"] = millis();
        doc["sequence"] = _sequenceNumber;
        
        JsonObject payload = doc["payload"].to<JsonObject>();
        payload["sensor"] = sensorName;
        
        if (result.error == ErrorCode::OK) {
            payload["status"] = "SUCCESS";
            payload["value"] = result.value;
            if (result.secondaryValue > 0) {
                payload["secondaryValue"] = result.secondaryValue;
            }
            payload["confidence"] = result.confidence;
            payload["sampleCount"] = result.sampleCount;
            payload["measurementTimeMs"] = result.measurementTime;
            
            JsonObject flags = payload["flags"].to<JsonObject>();
            flags["signalStable"] = result.flags.signalStable;
            flags["enoughSamples"] = result.flags.enoughSamples;
            flags["targetDetected"] = result.flags.targetDetected;
            flags["motionDetected"] = result.flags.motionDetected;
            flags["passedValidation"] = result.flags.passedValidation;
        } else {
            payload["status"] = "ERROR";
            payload["errorCode"] = static_cast<int>(result.error);
        }

        serializeJson(doc, outputBuffer, bufferSize);
    }

    void JsonSerializer::serializeLiveMeasurement(const char* sensorName, const char* machineState, const Models::MeasurementResult& result, char* outputBuffer, size_t bufferSize) {
        _sequenceNumber++;
        JsonDocument doc;
        
        doc["protocol"] = "2.0";
        doc["firmware"] = Config::FW_VERSION;
        doc["type"] = "measurement";
        doc["timestamp"] = millis();
        doc["sequence"] = _sequenceNumber;
        
        JsonObject payload = doc["payload"].to<JsonObject>();
        payload["sensor"] = sensorName;
        
        // Use the explicit machineState passed down from the state machine
        payload["status"] = machineState;
        
        payload["debug_ir"] = result.confidence; // We can repurpose confidence to send the sqi or avgIR, but let's just send it if the sensor supports it.
        
        payload["value"] = result.value;
        if (result.secondaryValue > 0) {
            payload["secondaryValue"] = result.secondaryValue;
        }
        
        serializeJson(doc, outputBuffer, bufferSize);
    }

    void JsonSerializer::serializeError(const char* errorType, const char* message, char* outputBuffer, size_t bufferSize) {
        _sequenceNumber++;
        JsonDocument doc;
        doc["protocol"] = "2.0";
        doc["firmware"] = Config::FW_VERSION;
        doc["type"] = "error";
        doc["timestamp"] = millis();
        doc["sequence"] = _sequenceNumber;
        
        JsonObject payload = doc["payload"].to<JsonObject>();
        payload["errorType"] = errorType;
        payload["message"] = message;
        
        serializeJson(doc, outputBuffer, bufferSize);
    }

    void JsonSerializer::serializeInfo(const char* infoType, const char* message, char* outputBuffer, size_t bufferSize) {
        _sequenceNumber++;
        JsonDocument doc;
        doc["protocol"] = "2.0";
        doc["firmware"] = Config::FW_VERSION;
        doc["type"] = "info";
        doc["timestamp"] = millis();
        doc["sequence"] = _sequenceNumber;
        
        JsonObject payload = doc["payload"].to<JsonObject>();
        payload["infoType"] = infoType;
        payload["message"] = message;
        
        serializeJson(doc, outputBuffer, bufferSize);
    }

} // namespace SerialComm
} // namespace HealthKiosk
