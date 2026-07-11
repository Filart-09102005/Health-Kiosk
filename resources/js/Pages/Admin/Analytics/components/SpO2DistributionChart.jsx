/**
 * SpO2DistributionChart
 * SpO2 classification bar chart — Low SpO2, Normal, High SpO2.
 * Reusable: pass `data` from analyticsData.spo2_distribution.
 */

import { Activity } from "lucide-react";
import DistributionBarChart from "./DistributionBarChart";

export default function SpO2DistributionChart({ data }) {
    return (
        <DistributionBarChart
            title="SpO2 classification"
            description="Low SpO2, normal oxygen saturation, and high SpO2 readings."
            data={data}
            icon={Activity}
        />
    );
}
