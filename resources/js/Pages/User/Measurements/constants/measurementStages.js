import {
    Activity, CheckCircle2, Droplets, Gauge, HeartPulse, Loader2,
    Radio, Ruler, ScanLine, Scale, Sparkles, Thermometer, Timer,
} from "lucide-react";

/**
 * Stage tables for the measurement progress bar.
 *
 * Two rules shape every table here:
 *
 *  1. Nothing advances before the sensor has actually detected the person.
 *     Until then the bar sits at 0 and the copy tells them what to do.
 *  2. `at` is the percentage a stage *starts* at. Progress eases across the
 *     band toward the next stage but stops just short of it, so the bar can
 *     only cross a boundary when something real happened. 100 is reserved for
 *     a settled, finalised reading.
 *
 * `states` maps real firmware machine states onto a stage — when the hardware
 * reports one, the bar jumps forward to it. `weight` is that stage's share of
 * the reading window, used to keep things moving for sensors whose firmware
 * does not report fine-grained states.
 *
 * Adding a future sensor is a new entry in MEASUREMENT_STAGES; the hook and
 * the panel read whatever is here.
 */

export const DEFAULT_NO_DETECTION_TIMEOUT_MS = 25000;

const COMPLETE_STAGE = { key: "complete", at: 100, label: "Measurement Complete", icon: CheckCircle2 };

export const MEASUREMENT_STAGES = {
    heart_rate: {
        // Copy shown while the sensor has not seen a finger yet.
        waitingLabel: "Waiting for finger…",
        waitingHint: "Place your index finger on the sensor and keep it still.",
        // Shown when a finger that *was* detected goes away mid-reading.
        lostLabel: "Finger removed",
        lostHint: "Finger removed. Please place your finger back on the sensor.",
        // Heart rate needs real continuous collection; hold progress rather
        // than resetting, so a brief slip does not throw the reading away.
        onLost: "hold",
        durationMs: 9000,
        stages: [
            { key: "init", at: 10, label: "Initializing sensor…", icon: Radio, states: ["WAITING", "INITIALIZE"], weight: 1 },
            { key: "validate", at: 25, label: "Validating signal quality…", icon: Activity, states: ["VALIDATING", "READY"], weight: 1.4 },
            { key: "collect_hr", at: 45, label: "Collecting heart rate…", icon: HeartPulse, states: ["COUNTDOWN", "COLLECTING"], weight: 2.2 },
            { key: "collect_spo2", at: 65, label: "Calculating SpO₂…", icon: Droplets, weight: 2 },
            { key: "process", at: 80, label: "Processing readings…", icon: Loader2, states: ["PROCESSING"], weight: 1.2 },
            { key: "finalize", at: 90, label: "Finalizing results…", icon: Sparkles, weight: 1 },
            COMPLETE_STAGE,
        ],
    },

    weight: {
        waitingLabel: "Waiting for user…",
        waitingHint: "Step onto the scale with both feet and stand still.",
        lostLabel: "Stepped off the scale",
        lostHint: "Please stand still on the weighing scale.",
        // A weight reading is only meaningful while they are on the platform,
        // so stepping off genuinely invalidates what was collected.
        onLost: "reset",
        durationMs: 5000,
        stages: [
            { key: "detect", at: 15, label: "Detecting weight…", icon: Scale, states: ["WAITING", "INITIALIZE"], weight: 1 },
            { key: "stability", at: 40, label: "Checking stability…", icon: Gauge, states: ["VALIDATING", "READY"], weight: 1.6 },
            { key: "stable", at: 70, label: "Weight stabilized…", icon: Activity, states: ["COUNTDOWN", "COLLECTING"], weight: 1.4 },
            { key: "finalize", at: 90, label: "Finalizing…", icon: Sparkles, states: ["PROCESSING"], weight: 1 },
            COMPLETE_STAGE,
        ],
    },

    temperature: {
        waitingLabel: "Waiting for sensor detection…",
        waitingHint: "Point the thermometer at your forehead, about 3cm away.",
        lostLabel: "Sensor lost the reading",
        lostHint: "Hold the thermometer steady at the marked distance.",
        onLost: "hold",
        durationMs: 3000,
        stages: [
            { key: "read", at: 20, label: "Reading temperature…", icon: Thermometer, states: ["WAITING", "INITIALIZE", "VALIDATING", "READY"], weight: 1.6 },
            { key: "verify", at: 70, label: "Verifying result…", icon: ScanLine, states: ["COLLECTING", "PROCESSING"], weight: 1 },
            COMPLETE_STAGE,
        ],
    },

    height: {
        waitingLabel: "Waiting for proper position…",
        waitingHint: "Stand up straight under the sensor and keep your head level.",
        lostLabel: "Position lost",
        lostHint: "Please stand up straight under the sensor.",
        onLost: "hold",
        durationMs: 2500,
        stages: [
            { key: "measure", at: 30, label: "Measuring height…", icon: Ruler, states: ["WAITING", "INITIALIZE", "VALIDATING", "READY"], weight: 1.5 },
            { key: "verify", at: 80, label: "Verifying…", icon: ScanLine, states: ["COLLECTING", "PROCESSING"], weight: 1 },
            COMPLETE_STAGE,
        ],
    },
};

// Falls back to a generic three-step table so an unconfigured measurement type
// still gets honest progress rather than crashing.
export const FALLBACK_STAGE_TABLE = {
    waitingLabel: "Waiting for sensor…",
    waitingHint: "Follow the instructions on screen to begin.",
    lostLabel: "Sensor lost the reading",
    lostHint: "Please reposition and hold still.",
    onLost: "hold",
    durationMs: 5000,
    stages: [
        { key: "read", at: 20, label: "Reading…", icon: Radio, states: ["WAITING", "INITIALIZE", "VALIDATING", "READY"], weight: 1.5 },
        { key: "verify", at: 75, label: "Verifying…", icon: ScanLine, states: ["COLLECTING", "PROCESSING"], weight: 1 },
        COMPLETE_STAGE,
    ],
};

export const stageTableFor = (type) => MEASUREMENT_STAGES[type] || FALLBACK_STAGE_TABLE;

export const WAITING_ICON = Timer;
