import { useMemo } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartTooltipStyle, getChartTheme } from "../utils/chartTheme";
import ChartCard from "./ChartCard";

export default function DailyHealthChecksChart({ data = [], period = "weekly", onPeriodChange }) {
    const theme = useMemo(() => getChartTheme(), []);

    const action = (
        <div className="flex items-center rounded-[0.875rem] border p-1" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            {["weekly", "monthly", "yearly"].map((p) => {
                const isActive = period === p;
                return (
                    <button
                        key={p}
                        onClick={() => onPeriodChange?.(p)}
                        className={`px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-wider transition-all rounded-[8px] ${isActive ? "shadow-sm" : "hover:brightness-110"}`}
                        style={{
                            backgroundColor: isActive ? "var(--color-card)" : "transparent",
                            color: isActive ? "var(--color-text)" : "var(--color-muted)",
                            borderColor: isActive ? "var(--color-border)" : "transparent",
                            borderWidth: "1px",
                        }}
                    >
                        {p}
                    </button>
                );
            })}
        </div>
    );

    const description = 
        period === "weekly" ? "Kiosk screenings completed per day this week." :
        period === "monthly" ? "Kiosk screenings completed per day this month." :
        "Kiosk screenings completed per month this year.";

    return (
        <ChartCard title="Daily Health Checks Trend" description={description} action={action}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                        <linearGradient id="checksGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={theme.primary} stopOpacity={0.35} />
                            <stop offset="100%" stopColor={theme.primary} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fill: theme.muted, fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: theme.muted, fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Line type="monotone" dataKey="checks" stroke={theme.primary} strokeWidth={3} dot={{ r: 4, fill: theme.primary }} activeDot={{ r: 6 }} />
                </LineChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}
