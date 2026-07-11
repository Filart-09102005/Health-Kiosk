/**
 * @file CommandParser.h
 * @brief Parses incoming serial commands from Python Bridge.
 */
#ifndef COMMAND_PARSER_H
#define COMMAND_PARSER_H

#include <Arduino.h>

namespace HealthKiosk {
namespace SerialComm {

    enum class CommandType {
        UNKNOWN,
        CMD_PING,
        SELF_TEST,
        GET_DIAGNOSTICS,
        START_TEMPERATURE,
        START_WEIGHT,
        START_HEIGHT,
        START_HEART,
        START_ALL,
        ENTER_CALIBRATION,
        GET_VERSION
    };

    class CommandParser {
    private:
        static const int MAX_CMD_LEN = 64;
        char _buffer[MAX_CMD_LEN];
        int _bufferPos;

    public:
        CommandParser();
        
        CommandType processChar(char c);
        CommandType parseString(const char* cmdString);
    };

} // namespace SerialComm
} // namespace HealthKiosk

#endif // COMMAND_PARSER_H
