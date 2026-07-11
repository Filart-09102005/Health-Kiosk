/**
 * HeartRateDistributionChart
 * Heart rate classification bar chart — Low, Normal, High.
 * Reusable: pass `data` from analyticsData.heart_rate_distribution.
 */

import { HeartPulse } from "lucide-react";
import DistributionBarChart from "./DistributionBarChart";

export default function HeartRateDistributionChart({ data }) {
    return (
        <DistributionBarChart
            title="Heart rate classification"
            description="Low, normal, and high pulse readings."
            data={data}
            icon={HeartPulse}
        />
    );
}
