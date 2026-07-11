// resources/js/Pages/Admin/Analytics/components/SpO2-Chart.jsx
// UI redesign — data/imports untouched.

import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartTooltipStyle, getChartTheme } from "../utils/chartTheme";
import AnalyticsChartCard from "./AnalyticsChartCard";

const COLOR = "#378ADD";

function StatStrip({ data }) {
    const values = data.length ? data.map((d) => d.value) : [0];
    const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
    const min = Math.min(...values).toFixed(1);
    const max = Math.max(...values).toFixed(1);
    const peakDay = data[values.indexOf(Math.max(...values))]?.label ?? "—";
    const stats = [
        { lbl: "Average", val: avg,          unit: "%" },
        { lbl: "Range",   val: `${min}–${max}`, unit: "%" },
        { lbl: "Peak day",val: peakDay },
    ];
    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: "8px", marginBottom: "1rem" }}>
            {stats.map(({ lbl, val, unit }) => (
                <div key={lbl} style={{ padding: "8px 12px", borderRadius: "10px", backgroundColor: "color-mix(in srgb, var(--color-surface) 60%, transparent)", border: "0.5px solid var(--color-border)" }}>
                    <div style={{ fontSize: "11px", color: "var(--color-muted)", marginBottom: "2px" }}>{lbl}</div>
                    <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-text)" }}>
                        {val}{unit && <span style={{ fontSize: "10px", color: "var(--color-muted)", marginLeft: "2px" }}>{unit}</span>}
                    </div>
                </div>
            ))}
        </div>
    );
}

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ ...chartTooltipStyle, borderRadius: "10px", padding: "10px 14px" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text)", marginBottom: "4px" }}>{label}</p>
            <p style={{ fontSize: "12px", color: COLOR, fontWeight: 600 }}>{payload[0].value}%</p>
        </div>
    );
}

function ChartLegend() {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "10px" }}>
            <svg width="18" height="10" aria-hidden="true"><line x1="0" y1="5" x2="18" y2="5" stroke={COLOR} strokeWidth="2.5" strokeLinecap="round" /></svg>
            <span style={{ fontSize: "11px", color: "var(--color-muted)" }}>SpO2 (%)</span>
        </div>
    );
}

export default function SpO2Chart({ data = [] }) {
    const theme = useMemo(() => getChartTheme(), []);

    return (
        <AnalyticsChartCard title="SpO2 trend" description="Blood oxygen saturation averages by day." heightClass="h-auto">
            <StatStrip data={data} />
            <div style={{ height: "0.5px", backgroundColor: "var(--color-border)", marginBottom: "1rem" }} />
            <div style={{ height: "150px" }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                        <defs>
                            <linearGradient id="spo2Fill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%"   stopColor={COLOR} stopOpacity={0.2} />
                                <stop offset="100%" stopColor={COLOR} stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="label" tick={{ fill: theme.muted, fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                        <YAxis domain={[96, 99]} tick={{ fill: theme.muted, fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="value" stroke={COLOR} strokeWidth={2} fill="url(#spo2Fill)"
                            dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: COLOR, fill: "var(--color-surface)" }} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <ChartLegend />
        </AnalyticsChartCard>
    );
}
