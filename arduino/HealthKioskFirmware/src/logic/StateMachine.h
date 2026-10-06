/**
 * @file StateMachine.h
 */
#ifndef STATE_MACHINE_H
#define STATE_MACHINE_H

#include "MeasurementManager.h"
#include "../serial/CommandParser.h"
#include "../config/ErrorCodes.h"

namespace HealthKiosk {
namespace Core {

    enum class SystemState {
        BOOT,
        SELF_TEST,
        READY,
        WAIT_COMMAND, 
        MEASURE,
        RESULT_READY,
        SEND,
        ERROR_STATE
    };

    class StateMachine {
    private:
        SystemState _currentState;
        MeasurementManager* _manager;
        SerialComm::CommandParser _parser;
        unsigned long _lastLiveUpdate = 0;
        
        HAL::IHardwareModule* _hals[3];
        int _numHals;

        SerialComm::CommandType _pendingCommand;

        bool _sensorOk[3];
        unsigned long _errorRetryTime = 0;

        void handleSelfTest();
        void processCommand(SerialComm::CommandType cmd);
        void performRecovery(ErrorCode err);

    public:
        StateMachine(MeasurementManager* manager,
                     HAL::IHardwareModule* h1, HAL::IHardwareModule* h2,
                     HAL::IHardwareModule* h3);
                     
        void begin();
        void update();
        SystemState getState() const;
    };

} // namespace Core
} // namespace HealthKiosk
#endif // STATE_MACHINE_H
