import { HeartPulse, Droplets } from "lucide-react";
import MeasurementFlowShell from "../components/MeasurementFlowShell";

export default function HeartRateFlow(props) {
    return (
        <MeasurementFlowShell
            {...props}
            config={{
                type: "heart_rate",
                instantCapture: false,
                readingDurationMs: 10000,
                title: "Heart Rate & SpO2",
                sensor: "Finger pulse oximeter",
                unit: "bpm/%",
                accent: "var(--color-error)",
                accentContent: "var(--color-error-content)",
                icon: HeartPulse,
                description: "Measure your pulse and blood oxygen level using the finger sensor.",
                instructions: "Put your index finger into the sensor clip.",
                positioning: "Place your index finger on the sensor. Keep your hand still until the screen shows the final value.",
                manualInstructions: "Measure your pulse and blood oxygen using your own pulse oximeter.",
                manualPositioning: "Take the reading on your pulse oximeter, then continue to enter both values.",
                metrics: [
                    { key: "primary", label: "Heart Rate", unit: "bpm", decimals: 0, icon: HeartPulse, pulse: true },
                    { key: "secondary", label: "SpO2", unit: "%", decimals: 0, icon: Droplets },
                ],
            }}
        />
    );
}
