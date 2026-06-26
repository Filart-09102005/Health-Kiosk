// resources/js/Pages/Admin/Analytics/components/HeartRate-Chart.jsx
// UI redesign — data/imports untouched.

import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartTooltipStyle, getChartTheme } from "../utils/chartTheme";
import AnalyticsChartCard from "./AnalyticsChartCard";

const COLOR = "#1D9E75";

function StatStrip({ data }) {
    const values = data.length ? data.map((d) => d.value) : [0];
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const peakDay = data[values.indexOf(max)]?.label ?? "—";
    const stats = [
        { lbl: "Average", val: avg,         unit: "bpm" },
        { lbl: "Range",   val: `${min}–${max}`, unit: "bpm" },
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
            <p style={{ fontSize: "12px", color: COLOR, fontWeight: 600 }}>{payload[0].value} bpm</p>
        </div>
    );
}

function ChartLegend() {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "10px" }}>
            <svg width="18" height="10" aria-hidden="true"><line x1="0" y1="5" x2="18" y2="5" stroke={COLOR} strokeWidth="2.5" strokeLinecap="round" /></svg>
            <span style={{ fontSize: "11px", color: "var(--color-muted)" }}>Heart rate (bpm)</span>
        </div>
    );
}

export default function HeartRateChart({ data = [] }) {
    const theme = useMemo(() => getChartTheme(), []);

    return (
        <AnalyticsChartCard title="Heart rate trend" description="Average BPM captured by MAX30102 sensors." heightClass="h-auto">
            <StatStrip data={data} />
            <div style={{ height: "0.5px", backgroundColor: "var(--color-border)", marginBottom: "1rem" }} />
            <div style={{ height: "150px" }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                        <CartesianGrid stroke={theme.border} strokeDasharray="4 4" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: theme.muted, fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: theme.muted, fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="value" stroke={COLOR} strokeWidth={2}
                            dot={{ r: 3, fill: COLOR, strokeWidth: 2, stroke: "var(--color-surface)" }}
                            activeDot={{ r: 5, strokeWidth: 2, stroke: COLOR, fill: "var(--color-surface)" }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <ChartLegend />
        </AnalyticsChartCard>
    );
}
