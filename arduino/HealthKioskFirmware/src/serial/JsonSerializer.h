/**
 * @file JsonSerializer.h
 * @brief ArduinoJson 7 Serialization layer.
 */
#ifndef JSON_SERIALIZER_H
#define JSON_SERIALIZER_H

#include <ArduinoJson.h>
#include "../models/MeasurementResult.h"

namespace HealthKiosk {
namespace SerialComm {

    class JsonSerializer {
    private:
        static unsigned long _sequenceNumber;
        
    public:
        static void serializeMeasurement(const char* sensorName, const Models::MeasurementResult& result, char* outputBuffer, size_t bufferSize);
        
        static void serializeLiveMeasurement(const char* sensorName, const char* machineState, const Models::MeasurementResult& result, char* outputBuffer, size_t bufferSize);
        
        // Serialize an error or busy response
        static void serializeError(const char* errorType, const char* message, char* outputBuffer, size_t bufferSize);
        
        // Serialize general diagnostics or system info
        static void serializeInfo(const char* infoType, const char* message, char* outputBuffer, size_t bufferSize);
    };

} // namespace SerialComm
} // namespace HealthKiosk

#endif // JSON_SERIALIZER_H
