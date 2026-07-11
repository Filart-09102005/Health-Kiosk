import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartTooltipStyle, getChartTheme } from "../utils/chartTheme";
import ChartCard from "./ChartCard";

export default function TemperatureAnalyticsChart({ data = [] }) {
    const theme = useMemo(() => getChartTheme(), []);

    return (
        <ChartCard title="Temperature Analytics" description="Average body temperature trend across clinic hours.">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                        <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={theme.primary} stopOpacity={0.35} />
                            <stop offset="100%" stopColor={theme.primary} stopOpacity={0.02} />
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="time" tick={{ fill: theme.muted, fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[36, 38]} tick={{ fill: theme.muted, fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Area type="monotone" dataKey="value" stroke={theme.primary} fill="url(#tempGradient)" strokeWidth={2.5} />
                </AreaChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}
