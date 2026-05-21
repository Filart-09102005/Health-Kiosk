import { useMemo } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { weeklyAnalytics } from "../data/demoData";
import { chartTooltipStyle, getChartTheme } from "../utils/chartTheme";
import AnalyticsChartCard from "./AnalyticsChartCard";

export default function WeeklyAnalyticsChart() {
    const theme = useMemo(() => getChartTheme(), []);

    return (
        <AnalyticsChartCard title="Weekly analytics" description="Multi-metric weekly health trends." className="xl:col-span-2">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyAnalytics} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke={theme.border} strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="week" tick={{ fill: theme.muted, fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: theme.muted, fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
                    <Line type="monotone" dataKey="temperature" name="Temperature" stroke={theme.primary} strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="heartRate" name="Heart rate" stroke={theme.success} strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="spo2" name="SpO2" stroke={theme.error} strokeWidth={2.5} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </AnalyticsChartCard>
    );
}
