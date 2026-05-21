import { Ruler } from "lucide-react";
import MeasurementFlowShell from "../components/MeasurementFlowShell";

export default function HeightFlow(props) {
    return (
        <MeasurementFlowShell
            {...props}
            config={{
                type: "height",
                title: "Height",
                sensor: "Ultrasonic height sensor",
                unit: "cm",
                icon: Ruler,
                description: "Measure standing height using the overhead kiosk sensor.",
                instructions: "Remove headwear if possible and stand straight under the height sensor.",
                positioning: "Keep feet flat, shoulders relaxed, and eyes forward until the sensor stabilizes.",
                format: (value) => `${Number(value).toFixed(1)} cm`,
            }}
        />
    );
}
