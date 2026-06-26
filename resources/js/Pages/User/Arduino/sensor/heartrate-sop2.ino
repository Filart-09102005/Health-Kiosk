/*
  Backup sketch: MAX30102/MAX30105 Heart Rate and SpO2 only
  Upload this only when testing the oximeter by itself.

  Commands:
    START_OXIMETER
    STOP

  Output:
    READY
    MODE:IDLE
    MODE:OXIMETER
    LIVE:OXIMETER:BPM,SpO2
    RESULT:OXIMETER:BPM,SpO2
    ERROR:message
    DONE
*/

#include <Wire.h>
#include "MAX30105.h"
#include "spo2_algorithm.h"

enum OximeterMode {
  IDLE,
  MEASURE_OXIMETER
};

OximeterMode currentMode = IDLE;
MAX30105 particleSensor;

const byte BUFFER_SIZE = 100;
uint32_t irBuffer[BUFFER_SIZE];
uint32_t redBuffer[BUFFER_SIZE];
int32_t spo2Value = 0;
int8_t spo2Valid = 0;
int32_t heartRateValue = 0;
int8_t heartRateValid = 0;
byte stableCount = 0;
int32_t lastHeartRateValue = 0;
int32_t lastSpo2Value = 0;

const byte STABLE_REQUIRED = 2;
const int BPM_TOLERANCE = 8;
const int SPO2_TOLERANCE = 2;
const long FINGER_IR_THRESHOLD = 10000;
const unsigned long TIMEOUT_MS = 30000;
const unsigned long LIVE_INTERVAL_MS = 500;
const unsigned long IDLE_INTERVAL_MS = 30000;

unsigned long startedAt = 0;
unsigned long lastLivePrint = 0;
unsigned long lastIdlePrint = 0;

void setup() {
  Serial.begin(115200);
  Serial.setTimeout(25);
  Wire.begin();

  if (!particleSensor.begin(Wire, I2C_SPEED_STANDARD)) {
    Serial.println("ERROR:MAX30102_NOT_FOUND");
  } else {
    particleSensor.setup(0x3F, 4, 2, 100, 411, 16384);
    particleSensor.setPulseAmplitudeRed(0x3F);
    particleSensor.setPulseAmplitudeIR(0x3F);
    particleSensor.setPulseAmplitudeGreen(0);
  }

  Serial.println("READY");
  Serial.println("MODE:IDLE");
}

void loop() {
  checkSerialCommand();

  if (currentMode == MEASURE_OXIMETER) {
    measureOximeter();
    return;
  }

  if (millis() - lastIdlePrint >= IDLE_INTERVAL_MS) {
    lastIdlePrint = millis();
    Serial.println("MODE:IDLE");
  }
}

void checkSerialCommand() {
  if (!Serial.available()) return;

  String command = Serial.readStringUntil('\n');
  command.trim();
  command.toUpperCase();

  if (command == "START_OXIMETER") {
    stableCount = 0;
    lastHeartRateValue = 0;
    lastSpo2Value = 0;
    startedAt = millis();
    lastLivePrint = 0;
    currentMode = MEASURE_OXIMETER;
    Serial.println("MODE:OXIMETER");
    return;
  }

  if (command == "STOP") {
    currentMode = IDLE;
    stableCount = 0;
    lastHeartRateValue = 0;
    lastSpo2Value = 0;
    Serial.println("MODE:IDLE");
    return;
  }

  if (command.length() > 0) {
    Serial.print("ERROR:UNKNOWN_COMMAND:");
    Serial.println(command);
  }
}

void measureOximeter() {
  if (millis() - startedAt > TIMEOUT_MS) {
    Serial.println("ERROR:OXIMETER_TIMEOUT");
    finish();
    return;
  }

  particleSensor.check();
  long irValue = particleSensor.getIR();

  if (millis() - lastLivePrint >= LIVE_INTERVAL_MS) {
    lastLivePrint = millis();
    Serial.print("DEBUG:IR:");
    Serial.println(irValue);

    if (irValue < FINGER_IR_THRESHOLD) {
      Serial.println("LIVE:OXIMETER:PLACE_FINGER,PLACE_FINGER");
    } else {
      Serial.println("LIVE:OXIMETER:FINGER_DETECTED,CALCULATING");
    }
  }

  if (irValue < FINGER_IR_THRESHOLD) {
    stableCount = 0;
    lastHeartRateValue = 0;
    lastSpo2Value = 0;
    return;
  }

  for (byte i = 0; i < BUFFER_SIZE; i++) {
    while (!particleSensor.available()) {
      particleSensor.check();
      checkSerialCommand();
      if (currentMode != MEASURE_OXIMETER) return;
    }
    redBuffer[i] = particleSensor.getRed();
    irBuffer[i] = particleSensor.getIR();
    particleSensor.nextSample();
  }

  maxim_heart_rate_and_oxygen_saturation(
    irBuffer, BUFFER_SIZE, redBuffer,
    &spo2Value, &spo2Valid, &heartRateValue, &heartRateValid
  );

  bool validReading = heartRateValid && spo2Valid &&
    heartRateValue >= 40 && heartRateValue <= 180 &&
    spo2Value >= 70 && spo2Value <= 100;

  if (!validReading) {
    stableCount = 0;
    lastHeartRateValue = 0;
    lastSpo2Value = 0;
    return;
  }

  Serial.print("LIVE:OXIMETER:");
  Serial.print(heartRateValue);
  Serial.print(",");
  Serial.println(spo2Value);

  if (
    lastHeartRateValue > 0 &&
    lastSpo2Value > 0 &&
    abs(heartRateValue - lastHeartRateValue) <= BPM_TOLERANCE &&
    abs(spo2Value - lastSpo2Value) <= SPO2_TOLERANCE
  ) {
    stableCount++;
  } else {
    stableCount = 1;
  }

  lastHeartRateValue = heartRateValue;
  lastSpo2Value = spo2Value;

  if (stableCount >= STABLE_REQUIRED) {
    Serial.print("RESULT:OXIMETER:");
    Serial.print(heartRateValue);
    Serial.print(",");
    Serial.println(spo2Value);
    finish();
  }
}

void finish() {
  Serial.println("DONE");
  currentMode = IDLE;
  Serial.println("MODE:IDLE");
}
