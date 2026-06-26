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
};

export const MEASUREMENT_PROMPT_KEYS = {
    heart_rate: "heartRate",
    temperature: "temperature",
    height: "height",
    weight: "weight",
};
