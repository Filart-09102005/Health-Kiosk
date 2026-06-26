/*
  Backup sketch: HX711 weight sensor only
  Upload this only when testing the load-cell platform by itself.

  Commands:
    START_WEIGHT
    STOP

  Output:
    READY
    MODE:IDLE
    MODE:WEIGHT
    LIVE:WEIGHT:kg
    RESULT:WEIGHT:kg
    ERROR:message
    DONE
*/

#include <math.h>
#include <HX711.h>

enum WeightMode {
  IDLE,
  MEASURE_WEIGHT
};

WeightMode currentMode = IDLE;
HX711 scale;

const byte HX711_DOUT_PIN = 3;
const byte HX711_SCK_PIN = 2;
const float CALIBRATION_FACTOR = -7050.0; // Adjust after calibration. Change sign if readings are negative.
const float MIN_USER_WEIGHT_KG = 10.0; // Use 1.0 while testing small objects, then 10.0 for real users.
const float STABLE_TOLERANCE_KG = 0.15;
const byte STABLE_REQUIRED = 6;
const unsigned long TIMEOUT_MS = 30000;
const unsigned long LIVE_INTERVAL_MS = 500;
const unsigned long IDLE_INTERVAL_MS = 8000;

bool scaleReady = false;
float lastWeight = 0;
byte stableCount = 0;
unsigned long startedAt = 0;
unsigned long lastLivePrint = 0;
unsigned long lastIdlePrint = 0;

void setup() {
  Serial.begin(115200);
  Serial.setTimeout(25);

  scale.begin(HX711_DOUT_PIN, HX711_SCK_PIN);
  scale.set_scale(CALIBRATION_FACTOR);
  if (scale.is_ready()) {
    scale.tare();
    scaleReady = true;
  } else {
    Serial.println("ERROR:HX711_NOT_READY");
  }

  Serial.println("READY");
  Serial.println("MODE:IDLE");
}

void loop() {
  checkSerialCommand();

  if (currentMode == MEASURE_WEIGHT) {
    measureWeight();
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

  if (command == "START_WEIGHT") {
    if (!scaleReady) {
      Serial.println("ERROR:HX711_NOT_READY");
      return;
    }
    startedAt = millis();
    lastLivePrint = 0;
    lastWeight = 0;
    stableCount = 0;
    currentMode = MEASURE_WEIGHT;
    Serial.println("MODE:WEIGHT");
    Serial.println("LIVE:WEIGHT:TARING");
    scale.tare(20);
    return;
  }

  if (command == "STOP") {
    currentMode = IDLE;
    stableCount = 0;
    Serial.println("MODE:IDLE");
    return;
  }

  if (command.length() > 0) {
    Serial.print("ERROR:UNKNOWN_COMMAND:");
    Serial.println(command);
  }
}

void measureWeight() {
  if (millis() - startedAt > TIMEOUT_MS) {
    Serial.println("ERROR:WEIGHT_TIMEOUT");
    finish();
    return;
  }

  if (!scale.is_ready()) {
    stableCount = 0;
    Serial.println("LIVE:WEIGHT:0.00");
    delay(200);
    return;
  }

  float weightKg = scale.get_units(5);
  if (weightKg < MIN_USER_WEIGHT_KG) {
    stableCount = 0;
    lastWeight = weightKg;
    if (millis() - lastLivePrint >= LIVE_INTERVAL_MS) {
      lastLivePrint = millis();
      Serial.println("LIVE:WEIGHT:0.00");
    }
    return;
  }

  if (millis() - lastLivePrint >= LIVE_INTERVAL_MS) {
    lastLivePrint = millis();
    Serial.print("LIVE:WEIGHT:");
    Serial.println(weightKg, 2);
  }

  if (fabs(weightKg - lastWeight) <= STABLE_TOLERANCE_KG) {
    stableCount++;
  } else {
    stableCount = 0;
  }
  lastWeight = weightKg;

  if (stableCount >= STABLE_REQUIRED) {
    Serial.print("RESULT:WEIGHT:");
    Serial.println(weightKg, 2);
    finish();
  }
}

void finish() {
  Serial.println("DONE");
  currentMode = IDLE;
  Serial.println("MODE:IDLE");
}
