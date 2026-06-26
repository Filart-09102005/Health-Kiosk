/*
  IoT-Based School Health Kiosk System
  Arduino Mega command-driven measurement firmware

  Serial commands from backend bridge:
    START_OXIMETER
    START_WEIGHT
    STOP

  Serial output to backend bridge:
    READY
    MODE:IDLE
    MODE:OXIMETER
    MODE:WEIGHT
    LIVE:OXIMETER:BPM,SpO2
    LIVE:WEIGHT:kg
    RESULT:OXIMETER:BPM,SpO2
    RESULT:WEIGHT:kg
    ERROR:message
    DONE
*/

#include <Wire.h>
#include <math.h>
#include "MAX30105.h"
#include "spo2_algorithm.h"
#include <HX711.h>

enum KioskMode {
  IDLE,
  MEASURE_OXIMETER,
  MEASURE_WEIGHT
};

KioskMode currentMode = IDLE;

MAX30105 particleSensor;
HX711 scale;
bool oximeterReady = false;
bool weightScaleReady = false;

const byte HX711_DOUT_PIN = 3;
const byte HX711_SCK_PIN = 2;
const float WEIGHT_CALIBRATION_FACTOR = -7050.0; // Adjust after calibration. Change sign if readings are negative.
const float MIN_USER_WEIGHT_KG = 10.0; // Use 1.0 while testing small objects, then 10.0 for real users.
const float WEIGHT_STABLE_TOLERANCE_KG = 0.15;
const byte WEIGHT_STABLE_REQUIRED = 6;

const byte OXIMETER_BUFFER_SIZE = 100;
uint32_t irBuffer[OXIMETER_BUFFER_SIZE];
uint32_t redBuffer[OXIMETER_BUFFER_SIZE];
int32_t spo2Value = 0;
int8_t spo2Valid = 0;
int32_t heartRateValue = 0;
int8_t heartRateValid = 0;
byte oximeterStableCount = 0;
int32_t lastHeartRateValue = 0;
int32_t lastSpo2Value = 0;
const byte OXIMETER_STABLE_REQUIRED = 2;
const int OXIMETER_BPM_TOLERANCE = 8;
const int OXIMETER_SPO2_TOLERANCE = 2;
const long FINGER_IR_THRESHOLD = 10000;
float lastWeight = 0;
byte weightStableCount = 0;

unsigned long lastIdlePrint = 0;
unsigned long modeStartedAt = 0;
unsigned long lastLivePrint = 0;
const unsigned long IDLE_PRINT_INTERVAL_MS = 30000;
const unsigned long MEASUREMENT_TIMEOUT_MS = 30000;
const unsigned long LIVE_PRINT_INTERVAL_MS = 500;

void setup() {
  Serial.begin(115200);
  Serial.setTimeout(25);
  Wire.begin();

  setupOximeter();
  setupWeight();
  allSensorsIdle();

  Serial.println("READY");
  Serial.println("MODE:IDLE");
}

void loop() {
  checkSerialCommand();

  switch (currentMode) {
    case IDLE:
      idleLoop();
      break;
    case MEASURE_OXIMETER:
      measureOximeter();
      break;
    case MEASURE_WEIGHT:
      measureWeight();
      break;
  }
}

void checkSerialCommand() {
  if (!Serial.available()) {
    return;
  }

  String command = Serial.readStringUntil('\n');
  command.trim();
  command.toUpperCase();

  if (command == "START_OXIMETER") {
    startMode(MEASURE_OXIMETER);
    return;
  }

  if (command == "START_WEIGHT") {
    startMode(MEASURE_WEIGHT);
    return;
  }

  if (command == "STOP") {
    stopMeasurement();
    return;
  }

  if (command.length() > 0) {
    Serial.print("ERROR:UNKNOWN_COMMAND:");
    Serial.println(command);
  }
}

void startMode(KioskMode nextMode) {
  stopCurrentMeasurementSilently();
  currentMode = nextMode;
  modeStartedAt = millis();
  lastLivePrint = 0;

if (currentMode == MEASURE_OXIMETER) {
  oximeterStableCount = 0;
  lastHeartRateValue = 0;
  lastSpo2Value = 0;

  if (!oximeterReady) {
    setupOximeter();
  }

  Serial.println("MODE:OXIMETER");
  return;
}

  if (currentMode == MEASURE_WEIGHT) {
    lastWeight = 0;
    weightStableCount = 0;
    Serial.println("MODE:WEIGHT");
    Serial.println("LIVE:WEIGHT:TARING");

    if (weightScaleReady && scale.is_ready()) {
      scale.tare(20);
    } else {
      Serial.println("ERROR:HX711_NOT_READY");
      finishMeasurement();
    }
  }
}

void stopMeasurement() {
  stopCurrentMeasurementSilently();
  allSensorsIdle();
  Serial.println("MODE:IDLE");
}

void stopCurrentMeasurementSilently() {
  oximeterStableCount = 0;
  lastHeartRateValue = 0;
  lastSpo2Value = 0;
  lastWeight = 0;
  weightStableCount = 0;
}

void allSensorsIdle() {
  currentMode = IDLE;
}

void idleLoop() {
  if (millis() - lastIdlePrint >= IDLE_PRINT_INTERVAL_MS) {
    lastIdlePrint = millis();
    Serial.println("MODE:IDLE");
  }
}

void setupOximeter() {
  if (!particleSensor.begin(Wire, I2C_SPEED_STANDARD)) {
    Serial.println("ERROR:MAX30102_NOT_FOUND");
    oximeterReady = false;
    return;
  }

  byte ledBrightness = 0x3F;
  byte sampleAverage = 4;
  byte ledMode = 2;
  byte sampleRate = 100;
  int pulseWidth = 411;
  int adcRange = 16384;

  particleSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange);
  particleSensor.setPulseAmplitudeRed(0x3F);
  particleSensor.setPulseAmplitudeIR(0x3F);
  particleSensor.setPulseAmplitudeGreen(0);

  oximeterReady = true;
}

void measureOximeter() {
  if (!oximeterReady) {
    Serial.println("ERROR:MAX30102_NOT_READY");
    finishMeasurement();
    return;
  }

  if (millis() - modeStartedAt > MEASUREMENT_TIMEOUT_MS) {
    Serial.println("ERROR:OXIMETER_TIMEOUT");
    finishMeasurement();
    return;
  }

  particleSensor.check();
  long irValue = particleSensor.getIR();

  if (millis() - lastLivePrint >= LIVE_PRINT_INTERVAL_MS) {
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
    oximeterStableCount = 0;
    lastHeartRateValue = 0;
    lastSpo2Value = 0;
    return;
  }

  for (byte i = 0; i < OXIMETER_BUFFER_SIZE; i++) {
    while (!particleSensor.available()) {
      particleSensor.check();
      checkSerialCommand();
      if (currentMode != MEASURE_OXIMETER) {
        return;
      }
    }

    redBuffer[i] = particleSensor.getRed();
    irBuffer[i] = particleSensor.getIR();
    particleSensor.nextSample();
  }

  maxim_heart_rate_and_oxygen_saturation(
    irBuffer,
    OXIMETER_BUFFER_SIZE,
    redBuffer,
    &spo2Value,
    &spo2Valid,
    &heartRateValue,
    &heartRateValid
  );

  bool validReading = heartRateValid && spo2Valid &&
    heartRateValue >= 40 && heartRateValue <= 180 &&
    spo2Value >= 70 && spo2Value <= 100;

  if (!validReading) {
    oximeterStableCount = 0;
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
    abs(heartRateValue - lastHeartRateValue) <= OXIMETER_BPM_TOLERANCE &&
    abs(spo2Value - lastSpo2Value) <= OXIMETER_SPO2_TOLERANCE
  ) {
    oximeterStableCount++;
  } else {
    oximeterStableCount = 1;
  }

  lastHeartRateValue = heartRateValue;
  lastSpo2Value = spo2Value;

  if (oximeterStableCount >= OXIMETER_STABLE_REQUIRED) {
    Serial.print("RESULT:OXIMETER:");
    Serial.print(heartRateValue);
    Serial.print(",");
    Serial.println(spo2Value);
    finishMeasurement();
  }
}

void setupWeight() {
  scale.begin(HX711_DOUT_PIN, HX711_SCK_PIN);
  scale.set_scale(WEIGHT_CALIBRATION_FACTOR);
  if (scale.is_ready()) {
    scale.tare();
    weightScaleReady = true;
  } else {
    Serial.println("ERROR:HX711_NOT_READY");
  }
}

void measureWeight() {
  if (!weightScaleReady) {
    Serial.println("ERROR:HX711_NOT_READY");
    finishMeasurement();
    return;
  }

  if (millis() - modeStartedAt > MEASUREMENT_TIMEOUT_MS) {
    Serial.println("ERROR:WEIGHT_TIMEOUT");
    finishMeasurement();
    return;
  }

  if (!scale.is_ready()) {
    weightStableCount = 0;
    Serial.println("LIVE:WEIGHT:0.00");
    delay(200);
    return;
  }

  float weightKg = scale.get_units(5);
  if (weightKg < MIN_USER_WEIGHT_KG) {
    weightStableCount = 0;
    lastWeight = weightKg;
    if (millis() - lastLivePrint >= LIVE_PRINT_INTERVAL_MS) {
      lastLivePrint = millis();
      Serial.println("LIVE:WEIGHT:0.00");
    }
    return;
  }

  if (millis() - lastLivePrint >= LIVE_PRINT_INTERVAL_MS) {
    lastLivePrint = millis();
    Serial.print("LIVE:WEIGHT:");
    Serial.println(weightKg, 2);
  }

  if (fabs(weightKg - lastWeight) <= WEIGHT_STABLE_TOLERANCE_KG) {
    weightStableCount++;
  } else {
    weightStableCount = 0;
  }

  lastWeight = weightKg;

  if (weightStableCount >= WEIGHT_STABLE_REQUIRED) {
    Serial.print("RESULT:WEIGHT:");
    Serial.println(weightKg, 2);
    weightStableCount = 0;
    finishMeasurement();
  }
}

void finishMeasurement() {
  stopCurrentMeasurementSilently();
  Serial.println("DONE");
  currentMode = IDLE;
  Serial.println("MODE:IDLE");
}
