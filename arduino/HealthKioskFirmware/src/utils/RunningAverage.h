/**
 * @file RunningAverage.h
 * @brief Computes the running average of a stream of floats.
 * 
 * Dependencies: None
 */

#ifndef RUNNING_AVERAGE_H
#define RUNNING_AVERAGE_H

namespace HealthKiosk {
namespace Utils {

    class RunningAverage {
    private:
        float sum;
        unsigned int count;

    public:
        RunningAverage() : sum(0.0f), count(0) {}

        void addValue(float value) {
            sum += value;
            count++;
        }

        void clear() {
            sum = 0.0f;
            count = 0;
        }

        float getAverage() const {
            if (count == 0) return 0.0f;
            return sum / static_cast<float>(count);
        }

        unsigned int getCount() const {
            return count;
        }
    };

} // namespace Utils
} // namespace HealthKiosk

#endif // RUNNING_AVERAGE_H
