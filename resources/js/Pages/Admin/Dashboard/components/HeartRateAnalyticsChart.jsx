import { useMemo } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartTooltipStyle, getChartTheme } from "../utils/chartTheme";
import ChartCard from "./ChartCard";

export default function HeartRateAnalyticsChart({ data = [] }) {
    const theme = useMemo(() => getChartTheme(), []);

    return (
        <ChartCard title="Heart Rate Analytics" description="Average pulse readings captured by MAX30102.">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <XAxis dataKey="time" tick={{ fill: theme.muted, fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: theme.muted, fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Line type="monotone" dataKey="value" stroke={theme.success} strokeWidth={3} dot={{ r: 4, fill: theme.success }} />
                </LineChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}
