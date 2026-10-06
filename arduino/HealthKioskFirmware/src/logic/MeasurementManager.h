/**
 * @file MeasurementManager.h
 * @brief Coordinates measurement modules.
 */
#ifndef MEASUREMENT_MANAGER_H
#define MEASUREMENT_MANAGER_H

#include "../modules/TemperatureMeasurement.h"
#include "../modules/WeightMeasurement.h"
#include "../modules/HeightMeasurement.h"
#include "../models/MeasurementResult.h"

namespace HealthKiosk {
namespace Core {

    enum class ActiveSensor {
        NONE,
        TEMPERATURE,
        WEIGHT,
        HEIGHT
    };

    class MeasurementManager {
    private:
        Modules::TemperatureMeasurement* _tempModule;
        Modules::WeightMeasurement* _weightModule;
        Modules::HeightMeasurement* _heightModule;

        ActiveSensor _activeSensor;
        bool _isFinished;
        Models::MeasurementResult _lastResult;

    public:
        MeasurementManager(
            Modules::TemperatureMeasurement* tempModule,
            Modules::WeightMeasurement* weightModule,
            Modules::HeightMeasurement* heightModule
        );

        bool startMeasurement(ActiveSensor sensor);
        void update();
        
        bool isBusy() const;
        bool isFinished() const;
        Models::MeasurementResult getResult() const;
        Models::MeasurementResult getCurrentResult() const;
        ActiveSensor getActiveSensor() const;
        Modules::MeasureState getActiveModuleState() const;
        void cancelMeasurement();
    };

} // namespace Core
} // namespace HealthKiosk

#endif // MEASUREMENT_MANAGER_H
