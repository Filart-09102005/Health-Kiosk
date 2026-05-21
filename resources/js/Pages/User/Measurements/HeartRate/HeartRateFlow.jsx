import { HeartPulse } from "lucide-react";
import MeasurementFlowShell from "../components/MeasurementFlowShell";

export default function HeartRateFlow(props) {
    return (
        <MeasurementFlowShell
            {...props}
            config={{
                type: "heart_rate",
                title: "Heart Rate & SpO2",
                sensor: "Pulse oximeter",
                unit: "bpm/%",
                icon: HeartPulse,
                description: "Capture pulse and blood oxygen level using the kiosk oximeter.",
                instructions: "Sit comfortably, relax your arm, and prepare one finger for the pulse oximeter.",
                positioning: "Place your finger flat inside the sensor. Keep still while the values stabilize.",
                format: (value, secondary) => `${Math.round(value)} bpm / ${Math.round(secondary || 0)}%`,
            }}
        />
    );
}
