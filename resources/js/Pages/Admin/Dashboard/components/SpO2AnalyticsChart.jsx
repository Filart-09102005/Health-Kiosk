import { useMemo } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartTooltipStyle, getChartTheme } from "../utils/chartTheme";
import ChartCard from "./ChartCard";

export default function SpO2AnalyticsChart({ data = [] }) {
    const theme = useMemo(() => getChartTheme(), []);

    return (
        <ChartCard title="SpO2 Analytics" description="Blood oxygen saturation trend from kiosk sensors.">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <XAxis dataKey="time" tick={{ fill: theme.muted, fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[94, 100]} tick={{ fill: theme.muted, fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Line type="monotone" dataKey="value" stroke={theme.primary} strokeWidth={3} dot={{ r: 4, fill: theme.primary }} />
                </LineChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}
