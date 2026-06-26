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
                description: "Measure your pulse and blood oxygen level using the finger sensor.",
                instructions: "Prepare your clean index finger. The kiosk will ask you to place it on the Heart Rate and SpO2 sensor.",
                positioning: "Place your index finger on the sensor. Keep your hand still until the screen shows the final value.",
                format: (value, secondary) => {
                    const heartRate = Number(value);
                    const spo2 = Number(secondary);
                    const heartRateText = Number.isFinite(heartRate) && heartRate > 0
                        ? `${Math.round(heartRate)} bpm`
                        : "-- bpm";
                    const spo2Text = Number.isFinite(spo2) && spo2 > 0
                        ? `${Math.round(spo2)}%`
                        : "--%";

                    return `${heartRateText} / ${spo2Text}`;
                },
            }}
        />
    );
}
