export const ASSISTANT_STORAGE_KEY = "healthKioskAssistantMode";

export const ASSISTANT_PROMPTS = {
    enabled: "Assistant mode enabled. Voice guidance is now active.",
    disabled: "Assistant mode disabled.",
    welcome: "Welcome. Please stand in front of the kiosk, then scan your barcode to continue.",
    loginBarcode: "Please place your school barcode near the scanner.",
    loginEmail: "Please enter your email and password to continue.",
    temperature: "Temperature is not available because the sensor is not connected.",
    heartRate: "Please place one finger on the Heart Rate and SpO2 sensor. Keep your hand still.",
    height: "Height is not available because the sensor is not connected.",
    weight: "Please stand with both feet flat on the scale. Keep still until the final weight appears.",
    results: "Your available kiosk readings are now shown.",
    logout: "Thank you for using the health kiosk.",
    dashboardGuide: "Welcome. To check your health, press Start Health Check and choose an available reading.",
    startMeasurement: "Opening health checks. Please choose Heart Rate and SpO2 or Weight.",

    // ── Measurement mode ──────────────────────────────────────────────
    // Spoken when the mode actually changes, and when the user asks how.
    modeGuide:
        "There are two measurement modes. Smart Mode reads your values automatically from the kiosk sensors. Manual Mode lets you type in readings from your own device. To switch, press the Smart Mode or Manual Mode button at the top of the health check list.",
    modeSmart:
        "Smart Mode is on. Your readings will be taken automatically by the kiosk sensors.",
    modeManual:
        "Manual Mode is on. You will type in the readings from your own device. Press a health check to begin.",

    // ── Manual entry flow ─────────────────────────────────────────────
    manualIntro:
        "Measure the reading using your own device first. When you have the number ready, press Next.",
    manualPositioning:
        "Take the reading on your device now. When you are ready, press Enter Values.",
    manualEntry:
        "Type the reading shown on your device, then press Review Values. The expected range is shown under each box.",
    manualInvalid:
        "That value is outside the expected range. Please check your device and type the reading again.",
    manualReview:
        "Please check the values you typed. Press Edit to correct them, or Confirm and Save to store this reading.",
    measurementSaved: "Measurement saved.",
};

export const MODE_PROMPT_KEYS = {
    smart: "modeSmart",
    manual: "modeManual",
};

export const MEASUREMENT_PROMPT_KEYS = {
    heart_rate: "heartRate",
    temperature: "temperature",
    height: "height",
    weight: "weight",
};
