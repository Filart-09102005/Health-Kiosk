/**
 * TemperatureDistributionChart
 * Temperature classification bar chart — Low Temperature, Normal, Elevated, High Temperature.
 * Reusable: pass `data` from analyticsData.temperature_distribution.
 */

import { Thermometer } from "lucide-react";
import DistributionBarChart from "./DistributionBarChart";

export default function TemperatureDistributionChart({ data }) {
    return (
        <DistributionBarChart
            title="Temperature classification"
            description="Low temperature, normal, elevated, and high temperature readings."
            data={data}
            icon={Thermometer}
        />
    );
}
