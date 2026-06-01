export const ALERTS_ENABLED_KEY = "healthKioskAlertsEnabled";
export const ALERT_SENSITIVITY_KEY = "healthKioskAlertSensitivity";
export const ALERT_SETTINGS_CHANGE_EVENT = "health-kiosk-alerts-setting-change";

export const sensitivityProfiles = {
    High: {
        label: "High",
        queueRate: 100,
        delayLabel: "Real-time",
        delayDetail: "Needs Attention records enter the alert queue immediately.",
        description: "100% detection. Every abnormal and Needs Attention record is queued in real time.",
        includeSeverity: ["Critical", "High", "Medium", "Low"],
    },
    Standard: {
        label: "Standard",
        queueRate: 80,
        delayLabel: "Short delay",
        delayDetail: "Needs Attention records are queued after a short verification delay.",
        description: "80% detection. Critical and high alerts are immediate; lower-priority records may be delayed.",
        includeSeverity: ["Critical", "High", "Medium"],
    },
    Low: {
        label: "Low",
        queueRate: 45,
        delayLabel: "Delayed",
        delayDetail: "Only stronger alerts are queued; Needs Attention records stay under 50% detection.",
        description: "Under 50% detection. Critical and high alerts remain visible, but low-priority records are held back.",
        includeSeverity: ["Critical", "High"],
    },
};

export function getStoredAlertSensitivity() {
    const stored = window.localStorage.getItem(ALERT_SENSITIVITY_KEY);

    return sensitivityProfiles[stored] ? stored : "Standard";
}

export function getAlertSensitivityProfile(mode = getStoredAlertSensitivity()) {
    return sensitivityProfiles[mode] ?? sensitivityProfiles.Standard;
}

export function saveAlertSensitivity(mode) {
    const safeMode = sensitivityProfiles[mode] ? mode : "Standard";

    window.localStorage.setItem(ALERT_SENSITIVITY_KEY, safeMode);
    window.dispatchEvent(new Event(ALERT_SETTINGS_CHANGE_EVENT));

    return safeMode;
}

export function isAlertsEnabled() {
    return window.localStorage.getItem(ALERTS_ENABLED_KEY) !== "false";
}

export function saveAlertsEnabled(enabled) {
    window.localStorage.setItem(ALERTS_ENABLED_KEY, enabled ? "true" : "false");
    window.dispatchEvent(new Event(ALERT_SETTINGS_CHANGE_EVENT));
}

export function applySensitivityToAlerts(alerts, mode) {
    const profile = getAlertSensitivityProfile(mode);

    return alerts
        .filter((alert) => profile.includeSeverity.includes(alert.severity))
        .map((alert) => ({
            ...alert,
            detectionRate: `${profile.queueRate}%`,
            queueMode: profile.label,
            queueDelay: profile.delayLabel,
            queueNote: profile.delayDetail,
        }));
}
