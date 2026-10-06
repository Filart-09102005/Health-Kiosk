/**
 * Standalone TF-Luna distance test.
 *
 * Wiring (Arduino Mega 2560):
 *   TF-Luna 5V  -> Mega 5V
 *   TF-Luna GND -> Mega GND
 *   TF-Luna TX  -> Mega RX1 (pin 19)
 *   TF-Luna RX  -> Mega TX1 (pin 18)
 *
 * Upload this, then open Serial Monitor at 115200 baud.
 * TF-Luna streams a 9-byte frame at 100Hz by default: 0x59 0x59 <dist_L> <dist_H> <strength_L> <strength_H> <temp_L> <temp_H> <checksum>
 */

void setup() {
    Serial.begin(115200);
    Serial1.begin(115200); // TF-Luna's default baud rate
    Serial.println("TF-Luna distance test starting...");
}

void loop() {
    static uint8_t frame[9];
    static uint8_t frameIndex = 0;

    while (Serial1.available()) {
        uint8_t b = Serial1.read();

        if (frameIndex == 0 && b != 0x59) continue; // hunting for first header byte
        if (frameIndex == 1 && b != 0x59) { frameIndex = 0; continue; } // hunting for second

        frame[frameIndex++] = b;

        if (frameIndex == 9) {
            frameIndex = 0;

            uint8_t checksum = 0;
            for (uint8_t i = 0; i < 8; i++) checksum += frame[i];

            if (checksum != frame[8]) {
                Serial.println("Checksum mismatch, discarding frame.");
                continue;
            }

            uint16_t distanceCm = frame[2] | (frame[3] << 8);
            uint16_t strength   = frame[4] | (frame[5] << 8);

            // Per TF-Luna's datasheet, strength below ~100 means the signal
            // is too weak for a trustworthy distance — nothing solid enough
            // in range, too close (<~20cm), or a low-reflectivity surface.
            if (strength < 100) {
                Serial.println("No target detected — point the sensor at a solid surface 20cm-3m away.");
                continue;
            }

            Serial.print("Distance: ");
            Serial.print(distanceCm);
            Serial.println(" cm");
        }
    }
}
