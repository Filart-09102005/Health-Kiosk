import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { heartRateTrend } from "../data/demoData";
import { chartTooltipStyle, getChartTheme } from "../utils/chartTheme";
import AnalyticsChartCard from "./AnalyticsChartCard";

export default function HeartRateTrendChart() {
    const theme = useMemo(() => getChartTheme(), []);

    return (
        <AnalyticsChartCard title="Heart rate trend" description="Average BPM captured by MAX30102 sensors.">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={heartRateTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke={theme.border} strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: theme.muted, fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: theme.muted, fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Line type="monotone" dataKey="value" stroke={theme.success} strokeWidth={3} dot={{ r: 4, fill: theme.success }} />
                </LineChart>
            </ResponsiveContainer>
        </AnalyticsChartCard>
    );
}
