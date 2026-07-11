/**
 * @file CircularBuffer.h
 * @brief A lightweight, templated circular buffer for memory-constrained environments.
 * 
 * Used for storing rolling windows of sensor data without dynamic allocation.
 * 
 * Dependencies: None
 */

#ifndef CIRCULAR_BUFFER_H
#define CIRCULAR_BUFFER_H

#include <stdint.h>
#include <stddef.h>

namespace HealthKiosk {
namespace Utils {

    template <typename T, size_t Size>
    class CircularBuffer {
    private:
        T buffer[Size];
        size_t head = 0;
        size_t tail = 0;
        size_t count = 0;

    public:
        CircularBuffer() {
            clear();
        }

        void clear() {
            head = 0;
            tail = 0;
            count = 0;
        }

        bool push(const T& item) {
            buffer[head] = item;
            head = (head + 1) % Size;
            if (count < Size) {
                count++;
            } else {
                tail = (tail + 1) % Size; // Overwrite oldest
            }
            return true;
        }

        bool pop(T& item) {
            if (isEmpty()) return false;
            item = buffer[tail];
            tail = (tail + 1) % Size;
            count--;
            return true;
        }

        T peek(size_t index) const {
            if (index >= count) return T(); // Default constructed T
            return buffer[(tail + index) % Size];
        }

        size_t getCount() const {
            return count;
        }

        bool isEmpty() const {
            return count == 0;
        }

        bool isFull() const {
            return count == Size;
        }
        
        constexpr size_t capacity() const {
            return Size;
        }
    };

} // namespace Utils
} // namespace HealthKiosk

#endif // CIRCULAR_BUFFER_H
