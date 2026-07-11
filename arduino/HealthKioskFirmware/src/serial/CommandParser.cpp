/**
 * @file CommandParser.cpp
 */
#include "CommandParser.h"
#include <string.h>

namespace HealthKiosk {
namespace SerialComm {

    CommandParser::CommandParser() : _bufferPos(0) {
        memset(_buffer, 0, MAX_CMD_LEN);
    }

    CommandType CommandParser::processChar(char c) {
        if (c == '\n' || c == '\r') {
            if (_bufferPos > 0) {
                CommandType type = parseString(_buffer);
                _bufferPos = 0;
                memset(_buffer, 0, MAX_CMD_LEN);
                return type;
            }
            return CommandType::UNKNOWN;
        }
        
        if (_bufferPos < MAX_CMD_LEN - 1) {
            _buffer[_bufferPos++] = c;
        } else {
            _bufferPos = 0;
            memset(_buffer, 0, MAX_CMD_LEN);
        }
        
        return CommandType::UNKNOWN;
    }

    CommandType CommandParser::parseString(const char* cmdString) {
        if (strcmp(cmdString, "PING") == 0) return CommandType::CMD_PING;
        if (strcmp(cmdString, "SELF_TEST") == 0) return CommandType::SELF_TEST;
        if (strcmp(cmdString, "GET_DIAGNOSTICS") == 0) return CommandType::GET_DIAGNOSTICS;
        if (strcmp(cmdString, "START_TEMPERATURE") == 0) return CommandType::START_TEMPERATURE;
        if (strcmp(cmdString, "START_WEIGHT") == 0) return CommandType::START_WEIGHT;
        if (strcmp(cmdString, "START_HEIGHT") == 0) return CommandType::START_HEIGHT;
        if (strcmp(cmdString, "START_HEART") == 0) return CommandType::START_HEART;
        if (strcmp(cmdString, "START_ALL") == 0) return CommandType::START_ALL;
        if (strcmp(cmdString, "ENTER_CALIBRATION") == 0) return CommandType::ENTER_CALIBRATION;
        if (strcmp(cmdString, "GET_VERSION") == 0) return CommandType::GET_VERSION;
        
        return CommandType::UNKNOWN;
    }

} // namespace SerialComm
} // namespace HealthKiosk
