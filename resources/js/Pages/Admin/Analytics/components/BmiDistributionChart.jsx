/**
 * BmiDistributionChart
 * BMI classification bar chart — Underweight, Normal, Overweight, Obese.
 * Reusable: pass `data` from analyticsData.bmi_distribution.
 */

import { Weight } from "lucide-react";
import DistributionBarChart from "./DistributionBarChart";

export default function BmiDistributionChart({ data }) {
    return (
        <DistributionBarChart
            title="BMI classification"
            description="Underweight, normal, overweight, and obese categories."
            data={data}
            icon={Weight}
        />
    );
}
