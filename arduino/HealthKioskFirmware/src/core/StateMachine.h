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
        
        HAL::IHardwareModule* _hals[4];
        int _numHals;
        
        SerialComm::CommandType _pendingCommand;
        
        void handleSelfTest();
        void processCommand(SerialComm::CommandType cmd);
        void performRecovery(ErrorCode err);

    public:
        StateMachine(MeasurementManager* manager, 
                     HAL::IHardwareModule* h1, HAL::IHardwareModule* h2, 
                     HAL::IHardwareModule* h3, HAL::IHardwareModule* h4);
                     
        void begin();
        void update();
        SystemState getState() const;
    };

} // namespace Core
} // namespace HealthKiosk
#endif // STATE_MACHINE_H
