import { Scale } from "lucide-react";
import MeasurementFlowShell from "../components/MeasurementFlowShell";

export default function WeightFlow(props) {
    return (
        <MeasurementFlowShell
            {...props}
            config={{
                type: "weight",
                title: "Weight",
                sensor: "Load cell platform",
                unit: "kg",
                icon: Scale,
                description: "Measure weight using the kiosk scale platform.",
                instructions: "Step onto the scale platform only when the kiosk is ready.",
                positioning: "Stand centered on the platform and remain still while weight stabilizes.",
                format: (value) => `${Number(value).toFixed(1)} kg`,
            }}
        />
    );
}
