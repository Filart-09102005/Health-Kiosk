export const ASSISTANT_STORAGE_KEY = "healthKioskAssistantMode";

export const ASSISTANT_PROMPTS = {
    enabled: "Assistant mode enabled. Voice guidance is now active.",
    disabled: "Assistant mode disabled.",
    welcome: "Welcome. Please login to continue.",
    loginBarcode: "Please place your barcode at the scanner.",
    loginEmail: "Please enter your email and password to continue.",
    temperature: "Please position your forehead near the temperature sensor.",
    heartRate: "Please place your finger inside the pulse oximeter.",
    height: "Please stand straight for height measurement.",
    weight: "Please stand properly on the weighing scale.",
    results: "Your health measurements are now available.",
    logout: "Thank you for using the health kiosk.",
    dashboardGuide: "Welcome. To check your health, press Start Measurement and choose the measurement you want to take.",
    startMeasurement: "Opening health measurements. Please choose heart rate and oxygen, temperature, height, or weight.",
};

export const MEASUREMENT_PROMPT_KEYS = {
    heart_rate: "heartRate",
    temperature: "temperature",
    height: "height",
    weight: "weight",
};
