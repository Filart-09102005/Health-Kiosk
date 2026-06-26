import { Scale } from "lucide-react";
import MeasurementFlowShell from "../components/MeasurementFlowShell";

export default function WeightFlow(props) {
    return (
        <MeasurementFlowShell
            {...props}
            config={{
                type: "weight",
                title: "Weight",
                sensor: "Load-cell platform",
                unit: "kg",
                icon: Scale,
                description: "Measure your body weight using the kiosk scale platform.",
                instructions: "Step onto the scale platform at the base of the kiosk when the screen tells you to start.",
                positioning: "Stand with both feet flat on the scale. Keep still until the screen shows the final weight.",
                format: (value) => {
                    const weight = Number(value);
                    return Number.isFinite(weight) && weight > 0 ? `${weight.toFixed(1)} kg` : "-- kg";
                },
            }}
        />
    );
}
