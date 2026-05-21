import { useMemo } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { sessionAnalytics } from "../data/demoData";
import { chartTooltipStyle, getChartTheme } from "../utils/chartTheme";
import AnalyticsChartCard from "./AnalyticsChartCard";

export default function SessionAnalyticsChart() {
    const theme = useMemo(() => getChartTheme(), []);
    const data = useMemo(() => [
        { name: "Completed", value: 318, color: theme.success },
        { name: "Incomplete", value: 24, color: theme.primary },
        { name: "Timeout", value: 8, color: theme.error },
    ], [theme]);

    return (
        <AnalyticsChartCard title="Session analytics" description="Completed, incomplete, and timeout sessions.">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={data} dataKey="value" nameKey="name" innerRadius={54} outerRadius={80} paddingAngle={4}>
                        {data.map((entry) => <Cell key={entry.name} fill={entry.color} stroke="transparent" />)}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700, color: theme.muted }} />
                </PieChart>
            </ResponsiveContainer>
        </AnalyticsChartCard>
    );
}
