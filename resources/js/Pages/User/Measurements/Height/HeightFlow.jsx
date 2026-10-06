import { Ruler } from "lucide-react";
import MeasurementFlowShell from "../components/MeasurementFlowShell";

export default function HeightFlow(props) {
    return (
        <MeasurementFlowShell
            {...props}
            config={{
                type: "height",
                // Waits for the sensor's own validated COMPLETE result instead
                // of freezing on the first live number — the baseline reading
                // with nobody under the sensor is itself a small, non-zero
                // "height" and must never be capturable as a real result.
                instantCapture: false,
                // ~3s — the ultrasonic reading settles almost immediately.
                readingDurationMs: 3000,
                title: "Height",
                sensor: "Ultrasonic distance sensor",
                unit: "cm",
                accent: "var(--color-info)",
                accentContent: "var(--color-info-content)",
                icon: Ruler,
                description: "Measure your standing height using the kiosk ultrasonic sensor.",
                instructions: "Please stand up straight under the sensor at the top.",
                positioning: "Get the flat plyboard and place it flat on top of your head, then stay completely still while the sensor takes the reading.",
                manualInstructions: "Measure your standing height using a stadiometer or tape measure.",
                manualPositioning: "Take the measurement, then continue to enter your height in centimetres.",
                metrics: [
                    { key: "primary", label: "Height", unit: "cm", decimals: 1 },
                ],
            }}
        />
    );
}