import { Thermometer } from "lucide-react";
import MeasurementFlowShell from "../components/MeasurementFlowShell";

export default function TemperatureFlow(props) {
    return (
        <MeasurementFlowShell
            {...props}
            config={{
                type: "temperature",
                title: "Temperature",
                sensor: "Infrared thermometer",
                unit: "C",
                icon: Thermometer,
                description: "Measure body temperature using the kiosk infrared sensor.",
                instructions: "Stand in front of the kiosk and keep your face visible to the temperature sensor.",
                positioning: "Hold still at the marked distance until the reading stabilizes.",
                format: (value) => `${Number(value).toFixed(1)} C`,
            }}
        />
    );
}
