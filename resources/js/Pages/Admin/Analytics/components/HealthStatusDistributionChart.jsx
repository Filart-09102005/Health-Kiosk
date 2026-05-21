import { useMemo } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { healthStatusDistribution } from "../data/demoData";
import { chartTooltipStyle, getChartTheme } from "../utils/chartTheme";
import AnalyticsChartCard from "./AnalyticsChartCard";

export default function HealthStatusDistributionChart() {
    const theme = useMemo(() => getChartTheme(), []);
    const data = useMemo(() => [
        { name: "Normal", value: 214, color: theme.success },
        { name: "Watch", value: 26, color: theme.primary },
        { name: "Alert", value: 18, color: theme.error },
        { name: "Incomplete", value: 12, color: theme.muted },
    ], [theme]);

    return (
        <AnalyticsChartCard title="Health status distribution" description="Clinical outcomes across all screenings.">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={86} paddingAngle={3}>
                        {data.map((entry) => <Cell key={entry.name} fill={entry.color} stroke="transparent" />)}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700, color: theme.muted }} />
                </PieChart>
            </ResponsiveContainer>
        </AnalyticsChartCard>
    );
}
