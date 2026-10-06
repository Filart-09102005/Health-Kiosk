#include <Wire.h>

#include "MAX30105.h"

#include "spo2_algorithm.h"



MAX30105 particleSensor;



// ================= CONFIG =================

const int SAMPLE_COUNT = 100;

const int NEW_SAMPLES = 25;



const long FINGER_THRESHOLD = 2000;  // IMPORTANT FIX (your sensor is low IR)



// Stability rules

const int REQUIRED_STABLE_READINGS = 5;

const unsigned long MAX_MEASUREMENT_TIME = 30000;



// Acceptable ranges (for filtering bad readings)

const int MIN_BPM = 45;

const int MAX_BPM = 180;

const int MIN_SPO2 = 85;

const int MAX_SPO2 = 100;



// Stability tolerance

const int BPM_STABLE_DIFF = 5;

const int SPO2_STABLE_DIFF = 2;



// ================= BUFFERS =================

uint32_t irBuffer[SAMPLE_COUNT];

uint32_t redBuffer[SAMPLE_COUNT];



int32_t spo2;

int8_t validSPO2;

int32_t heartRate;

int8_t validHeartRate;



int stableBPM[REQUIRED_STABLE_READINGS];

int stableSPO2[REQUIRED_STABLE_READINGS];

int stableCount = 0;



int lastGoodBPM = 0;

int lastGoodSPO2 = 0;



// ================= SETUP =================

void setup() {

  Serial.begin(115200);

  Wire.begin();



  Serial.println("MAX30102 CAPSTONE SYSTEM STARTING...");



  if (!particleSensor.begin(Wire, I2C_SPEED_STANDARD)) {

    Serial.println("MAX30102 NOT FOUND!");

    while (1);

  }



  // STRONG LED SETTINGS (IMPORTANT FOR YOUR MODULE)

  byte ledBrightness = 0xFF;

  byte sampleAverage = 4;

  byte ledMode = 2;

  byte sampleRate = 100;

  int pulseWidth = 411;

  int adcRange = 16384;



  particleSensor.setup(

    ledBrightness,

    sampleAverage,

    ledMode,

    sampleRate,

    pulseWidth,

    adcRange

  );



  particleSensor.setPulseAmplitudeRed(0xFF);

  particleSensor.setPulseAmplitudeIR(0xFF);

  particleSensor.setPulseAmplitudeGreen(0);



  Serial.println("Place finger on sensor...");

}



// ================= LOOP =================

void loop() {



  long ir = particleSensor.getIR();



  // ===== Finger detection =====

  if (ir < FINGER_THRESHOLD) {

    Serial.print("IR=");

    Serial.print(ir);

    Serial.println(" | No finger");



    delay(300);

    return;

  }



  Serial.println("\nFinger detected. Measuring...");



  resetStableData();



  // ===== INITIAL SAMPLE =====

  for (int i = 0; i < SAMPLE_COUNT; i++) {

    readSample(i);

  }



  unsigned long startTime = millis();



  while (true) {



    long avgIR = getAverageIR();



    if (avgIR < FINGER_THRESHOLD) {

      Serial.println("Finger removed. Restart.");

      return;

    }



    maxim_heart_rate_and_oxygen_saturation(

      irBuffer,

      SAMPLE_COUNT,

      redBuffer,

      &spo2,

      &validSPO2,

      &heartRate,

      &validHeartRate

    );



    bool bpmOK = validHeartRate &&

                  heartRate >= MIN_BPM &&

                  heartRate <= MAX_BPM;



    bool spo2OK = validSPO2 &&

                  spo2 >= MIN_SPO2 &&

                  spo2 <= MAX_SPO2;



    Serial.print("IR=");

    Serial.print(avgIR);



    if (bpmOK) {

      Serial.print(" | BPM=");

      Serial.print(heartRate);

    } else {

      Serial.print(" | BPM=...");

    }



    if (spo2OK) {

      Serial.print(" | SpO2=");

      Serial.print(spo2);

      Serial.print("%");

    } else {

      Serial.print(" | SpO2=...");

    }



    // ===== STABILITY CHECK =====

    if (bpmOK && spo2OK) {

      handleStable(heartRate, spo2);

    } else {

      Serial.print(" | Stabilizing...");

    }



    Serial.println();



    // ===== FINAL RESULT =====

    if (stableCount >= REQUIRED_STABLE_READINGS) {

      printFinal();

      waitForRemove();

      return;

    }



    // ===== TIMEOUT =====

    if (millis() - startTime > MAX_MEASUREMENT_TIME) {

      Serial.println("\nTIMEOUT READING");



      if (lastGoodBPM > 0 && lastGoodSPO2 > 0) {

        Serial.print("BPM: ");

        Serial.println(lastGoodBPM);



        Serial.print("SpO2: ");

        Serial.println(lastGoodSPO2);

      } else {

        Serial.println("No stable reading.");

      }



      waitForRemove();

      return;

    }



    // ===== SLIDING WINDOW =====

    for (int i = NEW_SAMPLES; i < SAMPLE_COUNT; i++) {

      redBuffer[i - NEW_SAMPLES] = redBuffer[i];

      irBuffer[i - NEW_SAMPLES] = irBuffer[i];

    }



    for (int i = SAMPLE_COUNT - NEW_SAMPLES; i < SAMPLE_COUNT; i++) {

      readSample(i);

    }

  }

}



// ================= FUNCTIONS =================



void readSample(int index) {

  while (!particleSensor.available()) {

    particleSensor.check();

  }



  redBuffer[index] = particleSensor.getRed();

  irBuffer[index] = particleSensor.getIR();



  particleSensor.nextSample();

}



long getAverageIR() {

  long sum = 0;

  for (int i = 0; i < SAMPLE_COUNT; i++) {

    sum += irBuffer[i];

  }

  return sum / SAMPLE_COUNT;

}



void handleStable(int bpm, int oxygen) {



  lastGoodBPM = bpm;

  lastGoodSPO2 = oxygen;



  if (stableCount == 0) {

    stableBPM[0] = bpm;

    stableSPO2[0] = oxygen;

    stableCount = 1;

    return;

  }



  int last = stableCount - 1;



  int bpmDiff = abs(bpm - stableBPM[last]);

  int spo2Diff = abs(oxygen - stableSPO2[last]);



  if (bpmDiff <= BPM_STABLE_DIFF &&

      spo2Diff <= SPO2_STABLE_DIFF) {



    stableBPM[stableCount] = bpm;

    stableSPO2[stableCount] = oxygen;

    stableCount++;



    Serial.print(" | Stable ");

    Serial.print(stableCount);

    Serial.print("/");

    Serial.print(REQUIRED_STABLE_READINGS);



  } else {

    stableBPM[0] = bpm;

    stableSPO2[0] = oxygen;

    stableCount = 1;



    Serial.print(" | Reset stability");

  }

}



void printFinal() {



  int bpmSum = 0;

  int spo2Sum = 0;



  for (int i = 0; i < REQUIRED_STABLE_READINGS; i++) {

    bpmSum += stableBPM[i];

    spo2Sum += stableSPO2[i];

  }



  float finalBPM = bpmSum / (float)REQUIRED_STABLE_READINGS;

  float finalSPO2 = spo2Sum / (float)REQUIRED_STABLE_READINGS;



  Serial.println("\n========== FINAL RESULT ==========");

  Serial.print("Heart Rate: ");

  Serial.print(finalBPM);

  Serial.println(" BPM");



  Serial.print("SpO2: ");

  Serial.print(finalSPO2);

  Serial.println("%");



  Serial.println("==================================");

}



void resetStableData() {

  stableCount = 0;

  lastGoodBPM = 0;

  lastGoodSPO2 = 0;

}



void waitForRemove() {

  Serial.println("Remove finger...");



  while (particleSensor.getIR() > FINGER_THRESHOLD) {

    delay(500);

  }



  Serial.println("Ready again.\n");

}