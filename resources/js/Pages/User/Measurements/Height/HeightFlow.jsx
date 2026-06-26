import { Ruler } from "lucide-react";
import MeasurementFlowShell from "../components/MeasurementFlowShell";

export default function HeightFlow(props) {
    return (
        <MeasurementFlowShell
            {...props}
            config={{
                type: "height",
                title: "Height",
                sensor: "Ultrasonic distance sensor",
                unit: "cm",
                icon: Ruler,
                description: "Measure your standing height using the kiosk ultrasonic sensor.",
                instructions: "Stand straight against the kiosk height marker with your back upright and feet flat on the platform.",
                positioning: "Keep your head level and stay completely still while the sensor takes the reading.",
                format: (value) => `${Math.round(value)} cm`,
            }}
        />
    );
}