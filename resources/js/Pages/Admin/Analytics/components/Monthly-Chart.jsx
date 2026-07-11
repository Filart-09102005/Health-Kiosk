// resources/js/Pages/Admin/Analytics/components/Monthly-Chart.jsx
// UI redesign only — demo data and chart logic untouched.
// Replaces the <select> period picker with a pill-button group.
// Adds a 3-stat summary row (totals + share %) above the chart.
// Custom HTML legend replaces Recharts default legend.

import { useMemo, useState } from "react";
import {
    Area,
    AreaChart,
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
    { key: "completed",  label: "Completed sessions",  color: "#1D9E75" },
    { key: "incomplete", label: "Incomplete sessions", color: "#378ADD" },
    { key: "alerts",     label: "Alert cases",         color: "#E24B4A" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sumKey(data, key) {
    return data.reduce((acc, row) => acc + (row[key] ?? 0), 0);
}

function pct(part, total) {
    if (!total) return "0%";
    return `${Math.round((part / total) * 100)}%`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Pill-button period switcher */
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
                            backgroundColor: active
                                ? "var(--color-surface)"
                                : "transparent",
                            color: active
                                ? "var(--color-text)"
                                : "var(--color-muted)",
                        }}
                    >
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}

/** 3-column summary stat strip */
function StatStrip({ chartData }) {
    const totals = SERIES.map(({ key }) => sumKey(chartData, key));
    const grand = totals.reduce((a, b) => a + b, 0);

    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: "8px", marginBottom: "1rem" }}>
            {SERIES.map(({ key, label, color }, i) => (
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
                        <span
                            style={{
                                width: "7px",
                                height: "7px",
                                borderRadius: "50%",
                                backgroundColor: color,
                                flexShrink: 0,
                            }}
                        />
                        <span style={{ fontSize: "11px", color: "var(--color-muted)" }}>{label}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
                        <span style={{ fontSize: "20px", fontWeight: 600, color: "var(--color-text)" }}>
                            {totals[i].toLocaleString()}
                        </span>
                        <span style={{ fontSize: "11px", color, fontWeight: 600 }}>
                            {pct(totals[i], grand)}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}

/** Custom HTML legend row */
function ChartLegend() {
    return (
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "10px" }}>
            {SERIES.map(({ key, label, color }) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span
                        style={{
                            width: "18px",
                            height: "3px",
                            borderRadius: "2px",
                            backgroundColor: color,
                            display: "inline-block",
                        }}
                    />
                    <span style={{ fontSize: "11px", color: "var(--color-muted)" }}>{label}</span>
                </div>
            ))}
        </div>
    );
}

/** Recharts custom tooltip */
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
            {payload.map((entry) => (
                <div key={entry.dataKey} style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "2px" }}>
                    <span style={{ fontSize: "12px", color: "var(--color-muted)" }}>
                        {SERIES.find((s) => s.key === entry.dataKey)?.label ?? entry.dataKey}
                    </span>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: entry.stroke }}>
                        {entry.value}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function MonthlyChart({ data }) {
    const theme = useMemo(() => getChartTheme(), []);
    const [period, setPeriod] = useState("monthly");

    const chartData = data?.[period] || [];
    const periodLabel = periodOptions.find((o) => o.value === period)?.label ?? "Monthly";

    return (
        <AnalyticsChartCard
            title={`${periodLabel} analytics`}
            description="Stacked session and alert trends."
            className="xl:col-span-2"
            heightClass="h-auto"
            action={
                <PeriodPicker value={period} onChange={setPeriod} />
            }
        >
            {/* Stats strip */}
            <StatStrip chartData={chartData} />

            {/* Divider */}
            <div
                style={{
                    height: "0.5px",
                    backgroundColor: "var(--color-border)",
                    marginBottom: "1rem",
                }}
            />

            {/* Chart */}
            <div style={{ height: "220px" }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 6, right: 6, left: -18, bottom: 0 }}
                    >
                        <defs>
                            {SERIES.map(({ key, color }) => (
                                <linearGradient
                                    key={key}
                                    id={`grad-${key}`}
                                    x1="0" y1="0" x2="0" y2="1"
                                >
                                    <stop offset="0%"   stopColor={color} stopOpacity={0.22} />
                                    <stop offset="100%" stopColor={color} stopOpacity={0.03} />
                                </linearGradient>
                            ))}
                        </defs>
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
                            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
                        />
                        <Tooltip content={<CustomTooltip />} />

                        {SERIES.map(({ key, color }) => (
                            <Area
                                key={key}
                                type="monotone"
                                stackId="1"
                                dataKey={key}
                                stroke={color}
                                strokeWidth={2}
                                fill={`url(#grad-${key})`}
                                dot={false}
                                activeDot={{ r: 4, strokeWidth: 0, fill: color }}
                            />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <ChartLegend />
        </AnalyticsChartCard>
    );
}
