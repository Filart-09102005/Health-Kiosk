// resources/js/Pages/Admin/Analytics/components/Alerts-Chart.jsx
// UI redesign only — demo data and chart logic untouched.
// Replaces Recharts BarChart with a lightweight custom bar list:
//   - Animated fill bars (CSS transition via inline style trick)
//   - 3-stat summary strip at the top
//   - Top alert highlighted in full red; rest in muted red
//   - Custom tooltip via title attribute (no Recharts dependency needed)

import { useMemo, useEffect, useRef } from "react";
import { commonAlerts } from "../data/demoData";
import AnalyticsChartCard from "./AnalyticsChartCard";

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOR_TOP    = "#E24B4A";
const COLOR_REST   = "rgba(226,75,74,0.55)";
const COLOR_TRACK  = "color-mix(in srgb, var(--color-surface) 60%, transparent)";

// ─── Animated bar fill ────────────────────────────────────────────────────────

function AnimatedBar({ widthPct, color }) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        // Start at 0, animate to target on next frame
        el.style.width = "0%";
        const raf = requestAnimationFrame(() => {
            el.style.width = `${widthPct}%`;
        });
        return () => cancelAnimationFrame(raf);
    }, [widthPct]);

    return (
        <div
            style={{
                flex: 1,
                height: "10px",
                borderRadius: "6px",
                backgroundColor: COLOR_TRACK,
                overflow: "hidden",
            }}
        >
            <div
                ref={ref}
                style={{
                    height: "100%",
                    width: "0%",
                    borderRadius: "6px",
                    backgroundColor: color,
                    transition: "width 0.45s cubic-bezier(0.4,0,0.2,1)",
                }}
            />
        </div>
    );
}

// ─── Single bar row ───────────────────────────────────────────────────────────

function BarRow({ alert, count, max, isTop }) {
    const widthPct = Math.round((count / max) * 100);
    const color = isTop ? COLOR_TOP : COLOR_REST;

    return (
        <div
            style={{ display: "flex", alignItems: "center", gap: "10px" }}
            title={`${alert}: ${count}`}
        >
            <span
                style={{
                    fontSize: "11px",
                    fontWeight: 500,
                    color: "var(--color-muted)",
                    width: "148px",
                    flexShrink: 0,
                    textAlign: "right",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                }}
            >
                {alert}
            </span>
            <AnimatedBar widthPct={widthPct} color={color} />
            <span
                style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: isTop ? COLOR_TOP : "var(--color-muted)",
                    width: "32px",
                    textAlign: "right",
                    flexShrink: 0,
                }}
            >
                {count}
            </span>
        </div>
    );
}

// ─── Stat strip ───────────────────────────────────────────────────────────────

function StatStrip({ chartData }) {
    const total = chartData.reduce((a, b) => a + b.count, 0);
    const stats = [
        { lbl: "Total alerts",  val: total.toLocaleString() },
        { lbl: "Top alert",     val: chartData[0]?.count ?? 0 },
        { lbl: "Types tracked", val: chartData.length },
    ];
    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: "8px", marginBottom: "1rem" }}>
            {stats.map(({ lbl, val }) => (
                <div
                    key={lbl}
                    style={{
                        padding: "10px 14px",
                        borderRadius: "10px",
                        backgroundColor: "color-mix(in srgb, var(--color-surface) 60%, transparent)",
                        border: "0.5px solid var(--color-border)",
                    }}
                >
                    <div style={{ fontSize: "11px", color: "var(--color-muted)", marginBottom: "3px" }}>{lbl}</div>
                    <div style={{ fontSize: "18px", fontWeight: 600, color: "var(--color-text)" }}>{val}</div>
                </div>
            ))}
        </div>
    );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function AlertsChart({ data }) {
    const chartData = useMemo(() => data?.length ? data : commonAlerts, [data]);
    const max = useMemo(() => Math.max(1, ...chartData.map((d) => d.count)), [chartData]);

    return (
        <AnalyticsChartCard
            title="Most common alerts"
            description="Top alert types from kiosk health records."
            heightClass="h-auto"
        >
            <StatStrip chartData={chartData} />

            <div style={{ height: "0.5px", backgroundColor: "var(--color-border)", marginBottom: "1rem" }} />

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {chartData.map((row, i) => (
                    <BarRow
                        key={row.alert}
                        alert={row.alert}
                        count={row.count}
                        max={max}
                        isTop={i === 0}
                    />
                ))}
            </div>
        </AnalyticsChartCard>
    );
}