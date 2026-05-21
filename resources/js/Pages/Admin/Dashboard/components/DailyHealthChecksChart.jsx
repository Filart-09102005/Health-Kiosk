import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dailyHealthChecks } from "../data/demoData";
import { chartTooltipStyle, getChartTheme } from "../utils/chartTheme";
import ChartCard from "./ChartCard";

export default function DailyHealthChecksChart() {
    const theme = useMemo(() => getChartTheme(), []);

    return (
        <ChartCard title="Daily Health Checks Trend" description="Kiosk screenings completed per day this week.">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyHealthChecks} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                        <linearGradient id="checksGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={theme.primary} stopOpacity={0.35} />
                            <stop offset="100%" stopColor={theme.primary} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid stroke={theme.border} strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: theme.muted, fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: theme.muted, fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Line type="monotone" dataKey="checks" stroke={theme.primary} strokeWidth={3} dot={{ r: 4, fill: theme.primary }} activeDot={{ r: 6 }} />
                </LineChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}
