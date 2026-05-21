import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { monthlyAnalytics } from "../data/demoData";
import { chartTooltipStyle, getChartTheme } from "../utils/chartTheme";
import AnalyticsChartCard from "./AnalyticsChartCard";

export default function MonthlyAnalyticsChart() {
    const theme = useMemo(() => getChartTheme(), []);

    return (
        <AnalyticsChartCard title="Monthly analytics" description="Stacked monthly measurement activity." className="xl:col-span-2">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyAnalytics} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke={theme.border} strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: theme.muted, fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: theme.muted, fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
                    <Area type="monotone" stackId="1" dataKey="vitals" stroke={theme.primary} fill={theme.primary} fillOpacity={0.2} />
                    <Area type="monotone" stackId="1" dataKey="bmi" stroke={theme.success} fill={theme.success} fillOpacity={0.2} />
                    <Area type="monotone" stackId="1" dataKey="sessions" stroke={theme.error} fill={theme.error} fillOpacity={0.15} />
                </AreaChart>
            </ResponsiveContainer>
        </AnalyticsChartCard>
    );
}
