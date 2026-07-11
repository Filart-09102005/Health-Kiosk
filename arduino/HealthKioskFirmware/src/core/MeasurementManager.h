/**
 * @file MeasurementManager.h
 * @brief Coordinates measurement modules.
 */
#ifndef MEASUREMENT_MANAGER_H
#define MEASUREMENT_MANAGER_H

#include "../modules/TemperatureMeasurement.h"
#include "../modules/WeightMeasurement.h"
#include "../modules/HeightMeasurement.h"
#include "../modules/HeartMeasurement.h"
#include "../models/MeasurementResult.h"

namespace HealthKiosk {
namespace Core {

    enum class ActiveSensor {
        NONE,
        TEMPERATURE,
        WEIGHT,
        HEIGHT,
        HEART
    };

    class MeasurementManager {
    private:
        Modules::TemperatureMeasurement* _tempModule;
        Modules::WeightMeasurement* _weightModule;
        Modules::HeightMeasurement* _heightModule;
        Modules::HeartMeasurement* _heartModule;
        
        ActiveSensor _activeSensor;
        bool _isFinished;
        Models::MeasurementResult _lastResult;

    public:
        MeasurementManager(
            Modules::TemperatureMeasurement* tempModule,
            Modules::WeightMeasurement* weightModule,
            Modules::HeightMeasurement* heightModule,
            Modules::HeartMeasurement* heartModule
        );

        bool startMeasurement(ActiveSensor sensor);
        void update();
        
        bool isBusy() const;
        bool isFinished() const;
        Models::MeasurementResult getResult() const;
        ActiveSensor getActiveSensor() const;
        void cancelMeasurement();
    };

} // namespace Core
} // namespace HealthKiosk

#endif // MEASUREMENT_MANAGER_H
