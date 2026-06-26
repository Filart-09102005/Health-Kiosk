import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getChartTheme } from "../utils/chartTheme";
import ChartCard from "./ChartCard";

function BMITooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;

    return (
        <div
            className="rounded-lg border px-3 py-2 text-xs shadow-sm"
            style={{
                backgroundColor: "var(--color-card)",
                borderColor: "var(--color-border)",
                color: "var(--color-text)",
            }}
        >
            <p className="font-black">{label}</p>
            <p className="mt-1 font-semibold" style={{ color: "var(--color-muted)" }}>
                {payload[0].value} measurements
            </p>
        </div>
    );
}

export default function BMIDistributionChart({ data = [] }) {
    const theme = useMemo(() => getChartTheme(), []);

    return (
        <ChartCard title="BMI Distribution" description="Body mass index categories from kiosk measurements.">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke={theme.border} strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="range" tick={{ fill: theme.muted, fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: theme.muted, fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<BMITooltip />} cursor={false} />
                    <Bar
                        dataKey="count"
                        fill={theme.primary}
                        radius={[8, 8, 0, 0]}
                        maxBarSize={48}
                        activeBar={{ fill: theme.primary, stroke: theme.primary, strokeWidth: 2 }}
                    />
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}
