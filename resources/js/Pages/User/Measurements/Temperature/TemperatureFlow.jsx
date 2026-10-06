import { Thermometer } from "lucide-react";
import MeasurementFlowShell from "../components/MeasurementFlowShell";

export default function TemperatureFlow(props) {
    return (
        <MeasurementFlowShell
            {...props}
            config={{
                type: "temperature",
                // Waits for the sensor's own validated COMPLETE result instead
                // of freezing on the first live number (which is often just
                // warm-up noise before the reading has stabilized).
                instantCapture: false,
                // ~3.5s: infrared reads fast, so the old shared 7s window just
                // made a quick sensor feel slow.
                readingDurationMs: 3500,
                title: "Temperature",
                sensor: "Infrared thermometer",
                unit: "C",
                accent: "var(--color-warning)",
                accentContent: "var(--color-warning-content)",
                icon: Thermometer,
                description: "Measure body temperature using the kiosk infrared sensor.",
                instructions: "Get the temperature gun, point it at your forehead, and maintain a 3cm distance.",
                positioning: "Hold still at the marked distance until the reading stabilizes.",
                manualInstructions: "Measure your temperature using a digital thermometer.",
                manualPositioning: "Take the reading on your thermometer, then continue to enter the value.",
                metrics: [
                    { key: "primary", label: "Temperature", unit: "°C", decimals: 1 },
                ],
            }}
        />
    );
}