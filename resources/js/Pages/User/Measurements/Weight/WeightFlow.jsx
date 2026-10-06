import { Scale } from "lucide-react";
import MeasurementFlowShell from "../components/MeasurementFlowShell";

export default function WeightFlow(props) {
    return (
        <MeasurementFlowShell
            {...props}
            config={{
                type: "weight",
                // ~5.5s: long enough for the load cell to stabilise once both
                // feet are on the platform, short enough not to feel like a wait.
                readingDurationMs: 5500,
                title: "Weight",
                sensor: "Load-cell platform",
                unit: "kg",
                accent: "var(--color-success)",
                accentContent: "var(--color-success-content)",
                icon: Scale,
                description: "Measure your body weight using the kiosk scale platform.",
                instructions: "Step onto the scale platform at the base of the kiosk when the screen tells you to start.",
                positioning: "Stand with both feet flat on the scale. Keep still until the screen shows the final weight.",
                manualInstructions: "Measure your weight using a digital weighing scale.",
                manualPositioning: "Take the reading on your scale, then continue to enter your weight in kilograms.",
                metrics: [
                    { key: "primary", label: "Weight", unit: "kg", decimals: 1 },
                ],
            }}
        />
    );
}
