import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { spo2Trend } from "../data/demoData";
import { chartTooltipStyle, getChartTheme } from "../utils/chartTheme";
import AnalyticsChartCard from "./AnalyticsChartCard";

export default function SpO2TrendChart() {
    const theme = useMemo(() => getChartTheme(), []);

    return (
        <AnalyticsChartCard title="SpO2 trend" description="Blood oxygen saturation averages by day.">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spo2Trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                        <linearGradient id="spo2Fill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={theme.primary} stopOpacity={0.35} />
                            <stop offset="100%" stopColor={theme.primary} stopOpacity={0.02} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid stroke={theme.border} strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: theme.muted, fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[96, 99]} tick={{ fill: theme.muted, fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Area type="monotone" dataKey="value" stroke={theme.primary} fill="url(#spo2Fill)" strokeWidth={2.5} />
                </AreaChart>
            </ResponsiveContainer>
        </AnalyticsChartCard>
    );
}
