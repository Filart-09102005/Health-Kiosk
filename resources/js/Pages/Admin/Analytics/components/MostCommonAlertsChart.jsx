import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { commonAlerts } from "../data/demoData";
import { chartTooltipStyle, getChartTheme } from "../utils/chartTheme";
import AnalyticsChartCard from "./AnalyticsChartCard";

export default function MostCommonAlertsChart() {
    const theme = useMemo(() => getChartTheme(), []);

    return (
        <AnalyticsChartCard title="Most common alerts" description="Alert frequency analysis across kiosk sessions.">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={commonAlerts} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid stroke={theme.border} strokeDasharray="4 4" horizontal={false} />
                    <XAxis type="number" tick={{ fill: theme.muted, fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="alert" width={120} tick={{ fill: theme.muted, fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Bar dataKey="count" fill={theme.error} radius={[0, 8, 8, 0]} maxBarSize={18} />
                </BarChart>
            </ResponsiveContainer>
        </AnalyticsChartCard>
    );
}
