import { HeartPulse } from "lucide-react";
import MeasurementFlowShell from "../components/MeasurementFlowShell";

export default function HeartRateFlow(props) {
    return (
        <MeasurementFlowShell
            {...props}
            config={{
                type: "heart_rate",
                title: "Heart Rate & SpO2",
                sensor: "Finger pulse oximeter",
                unit: "bpm/%",
                icon: HeartPulse,
                description: "Capture pulse and blood oxygen level using the kiosk oximeter.",
                instructions: "Stand in front of the kiosk and prepare one finger for the finger pulse oximeter.",
                positioning: "Place your finger inside the SpO2 sensor. Keep your hand steady while the values stabilize.",
                format: (value, secondary) => `${Math.round(value)} bpm / ${Math.round(secondary || 0)}%`,
            }}
        />
    );
}
