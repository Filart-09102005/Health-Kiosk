/**
 * @file MLX90614Driver.cpp
 * @brief Implementation of MLX90614Driver.
 */

#include "MLX90614Driver.h"
#include <Wire.h>

namespace HealthKiosk {
namespace Drivers {

    MLX90614Driver::MLX90614Driver() : _lastError(ErrorCode::OK), _connected(false) {
    }

    void MLX90614Driver::setError(ErrorCode err) {
        _lastError = err;
    }

    bool MLX90614Driver::begin() {
        if (mlx.begin()) {
            _connected = true;
            setError(ErrorCode::OK);
            return true;
        }
        _connected = false;
        setError(ErrorCode::SENSOR_DISCONNECTED);
        return false;
    }

    bool MLX90614Driver::selfTest() {
        if (!begin()) return false;
        
        float obj = mlx.readObjectTempC();
        float amb = mlx.readAmbientTempC();
        
        if (isnan(obj) || isnan(amb) || 
            amb < -40.0f || amb > 125.0f ||
            obj < -70.0f || obj > 380.0f) {
            setError(ErrorCode::SENSOR_OUT_OF_RANGE);
            return false;
        }
        
        setError(ErrorCode::OK);
        return true;
    }

    bool MLX90614Driver::reset() {
        // MLX90614 does not have a soft reset via standard I2C without specific commands.
        // Re-init wire.
        return begin();
    }

    bool MLX90614Driver::isConnected() const {
        return _connected;
    }

    bool MLX90614Driver::readRaw(float& objectTempC, float& ambientTempC) {
        if (!_connected) {
            setError(ErrorCode::SENSOR_DISCONNECTED);
            return false;
        }

        objectTempC = mlx.readObjectTempC();
        ambientTempC = mlx.readAmbientTempC();

        if (isnan(objectTempC) || isnan(ambientTempC)) {
            setError(ErrorCode::SENSOR_TIMEOUT); // Or comm error
            return false;
        }

        setError(ErrorCode::OK);
        return true;
    }

    ErrorCode MLX90614Driver::lastError() const {
        return _lastError;
    }

    const char* MLX90614Driver::name() const { return "MLX90614"; }
    const char* MLX90614Driver::version() const { return "1.0.0"; }
    bool MLX90614Driver::supportsSelfTest() const { return true; }

} // namespace Drivers
} // namespace HealthKiosk
