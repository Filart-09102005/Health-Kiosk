// resources/js/Pages/Admin/Analytics/components/Weekly-Chart.jsx
// UI redesign only — demo data and chart logic untouched.
// Replaces the <select> period picker with a pill-button group.
// Adds a 3-stat average row above the chart.
// Custom tooltip and HTML legend replace Recharts defaults.
// Each line uses a distinct dash pattern for colorblind-safe encoding.

import { useMemo, useState } from "react";
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { chartTooltipStyle, getChartTheme } from "../utils/chartTheme";
import AnalyticsChartCard from "./AnalyticsChartCard";

// ─── Constants ────────────────────────────────────────────────────────────────

const periodOptions = [
    { value: "weekly",  label: "Weekly"  },
    { value: "monthly", label: "Monthly" },
    { value: "yearly",  label: "Yearly"  },
];

const SERIES = [
    { key: "heartRate",    label: "Heart rate",   unit: "bpm", color: "#1D9E75", strokeDasharray: undefined },
    { key: "spo2",         label: "SpO₂",         unit: "%",   color: "#378ADD", strokeDasharray: "6 3" },
    { key: "temperature",  label: "Temperature",  unit: "°C",  color: "#E24B4A", strokeDasharray: "3 3" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avg(arr) {
    if (!arr?.length) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function fmtAvg(arr, key) {
    const v = avg(arr);
    return key === "temperature" ? v.toFixed(1) : Math.round(v);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PeriodPicker({ value, onChange }) {
    return (
        <div
            role="group"
            aria-label="Analytics period"
            style={{
                display: "flex",
                gap: "3px",
                padding: "3px",
                borderRadius: "10px",
                border: "0.5px solid var(--color-border)",
                backgroundColor: "color-mix(in srgb, var(--color-surface) 60%, transparent)",
            }}
        >
            {periodOptions.map((opt) => {
                const active = opt.value === value;
                return (
                    <button
                        key={opt.value}
                        onClick={() => onChange(opt.value)}
                        aria-pressed={active}
                        style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "4px 13px",
                            borderRadius: "7px",
                            border: active ? "0.5px solid var(--color-border)" : "none",
                            cursor: "pointer",
                            transition: "background 0.15s, color 0.15s",
                            backgroundColor: active ? "var(--color-surface)" : "transparent",
                            color: active ? "var(--color-text)" : "var(--color-muted)",
                        }}
                    >
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}

function StatStrip({ chartData }) {
    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: "8px", marginBottom: "1rem" }}>
            {SERIES.map(({ key, label, unit, color }) => {
                const values = chartData.map((row) => row[key] ?? 0);
                return (
                    <div
                        key={key}
                        style={{
                            padding: "10px 14px",
                            borderRadius: "10px",
                            backgroundColor: "color-mix(in srgb, var(--color-surface) 60%, transparent)",
                            border: "0.5px solid var(--color-border)",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "4px" }}>
                            <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
                            <span style={{ fontSize: "11px", color: "var(--color-muted)" }}>{label}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
                            <span style={{ fontSize: "20px", fontWeight: 600, color: "var(--color-text)" }}>
                                {fmtAvg(values, key)}
                            </span>
                            <span style={{ fontSize: "11px", color: "var(--color-muted)" }}>{unit} avg</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function ChartLegend() {
    return (
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "10px" }}>
            {SERIES.map(({ key, label, color, strokeDasharray }) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <svg width="18" height="10" aria-hidden="true">
                        <line
                            x1="0" y1="5" x2="18" y2="5"
                            stroke={color}
                            strokeWidth="2.5"
                            strokeDasharray={strokeDasharray}
                            strokeLinecap="round"
                        />
                    </svg>
                    <span style={{ fontSize: "11px", color: "var(--color-muted)" }}>{label}</span>
                </div>
            ))}
        </div>
    );
}

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div
            style={{
                ...chartTooltipStyle,
                borderRadius: "10px",
                padding: "10px 14px",
                minWidth: "160px",
            }}
        >
            <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text)", marginBottom: "6px" }}>
                {label}
            </p>
            {payload.map((entry) => {
                const s = SERIES.find((s) => s.key === entry.dataKey);
                const v = s?.key === "temperature"
                    ? Number(entry.value).toFixed(1)
                    : Math.round(entry.value);
                return (
                    <div key={entry.dataKey} style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "2px" }}>
                        <span style={{ fontSize: "12px", color: "var(--color-muted)" }}>{s?.label ?? entry.name}</span>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: entry.stroke }}>
                            {v}{s?.unit ?? ""}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function WeeklyChart({ data }) {
    const theme = useMemo(() => getChartTheme(), []);
    const [period, setPeriod] = useState("weekly");

    const chartData = data?.[period] || [];
    const periodLabel = periodOptions.find((o) => o.value === period)?.label ?? "Weekly";

    return (
        <AnalyticsChartCard
            title={`${periodLabel} analytics`}
            description="Shows average heart rate, SpO₂, and temperature trends."
            className="xl:col-span-2"
            heightClass="h-auto"
            action={<PeriodPicker value={period} onChange={setPeriod} />}
        >
            {/* Stats strip */}
            <StatStrip chartData={chartData} />

            {/* Divider */}
            <div style={{ height: "0.5px", backgroundColor: "var(--color-border)", marginBottom: "1rem" }} />

            {/* Chart */}
            <div style={{ height: "220px" }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={chartData}
                        margin={{ top: 6, right: 6, left: -18, bottom: 0 }}
                    >
                        <CartesianGrid
                            stroke={theme.border}
                            strokeDasharray="4 4"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="label"
                            tick={{ fill: theme.muted, fontSize: 11, fontWeight: 600 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fill: theme.muted, fontSize: 11, fontWeight: 600 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />

                        {SERIES.map(({ key, label, color, strokeDasharray }) => (
                            <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                name={label}
                                stroke={color}
                                strokeWidth={2}
                                strokeDasharray={strokeDasharray}
                                dot={false}
                                activeDot={{ r: 4, strokeWidth: 2, stroke: color, fill: "var(--color-surface)" }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <ChartLegend />
        </AnalyticsChartCard>
    );
}
