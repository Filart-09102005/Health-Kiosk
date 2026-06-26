// resources/js/Pages/Admin/Analytics/components/BMI-Chart.jsx
// UI redesign — data/imports untouched.
// Replaces Recharts BarChart with a color-coded animated custom bar list.
// Each BMI category gets its own semantic color.

import { useMemo, useEffect, useRef } from "react";
import AnalyticsChartCard from "./AnalyticsChartCard";

const BMI_COLORS = {
    Underweight: "#378ADD",
    Normal:      "#1D9E75",
    Overweight:  "#EF9F27",
    Obese:       "#E24B4A",
};

function AnimatedBar({ widthPct, color }) {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.width = "0%";
        const raf = requestAnimationFrame(() => { el.style.width = `${widthPct}%`; });
        return () => cancelAnimationFrame(raf);
    }, [widthPct]);
    return (
        <div style={{ flex: 1, height: "10px", borderRadius: "6px", backgroundColor: "color-mix(in srgb, var(--color-surface) 60%, transparent)", overflow: "hidden" }}>
            <div ref={ref} style={{ height: "100%", width: "0%", borderRadius: "6px", backgroundColor: color, transition: "width 0.45s cubic-bezier(0.4,0,0.2,1)" }} />
        </div>
    );
}

function StatStrip({ data }) {
    const total = data.reduce((a, b) => a + b.count, 0);
    const normal = data.find((d) => d.range === "Normal")?.count ?? 0;
    const atRisk = data.filter((d) => ["Overweight", "Obese"].includes(d.range)).reduce((a, b) => a + b.count, 0);
    const stats = [
        { lbl: "Total",   val: total },
        { lbl: "Normal",  val: `${total ? Math.round((normal / total) * 100) : 0}%` },
        { lbl: "At risk", val: `${total ? Math.round((atRisk / total) * 100) : 0}%` },
    ];
    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: "8px", marginBottom: "1rem" }}>
            {stats.map(({ lbl, val }) => (
                <div key={lbl} style={{ padding: "8px 12px", borderRadius: "10px", backgroundColor: "color-mix(in srgb, var(--color-surface) 60%, transparent)", border: "0.5px solid var(--color-border)" }}>
                    <div style={{ fontSize: "11px", color: "var(--color-muted)", marginBottom: "2px" }}>{lbl}</div>
                    <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-text)" }}>{val}</div>
                </div>
            ))}
        </div>
    );
}

export default function BMIChart({ data }) {
    const chartData = useMemo(() => data || [], [data]);
    const max = useMemo(() => Math.max(1, ...chartData.map((d) => d.count)), [chartData]);

    return (
        <AnalyticsChartCard title="BMI distribution" description="Population spread across BMI categories." heightClass="h-auto">
            <StatStrip data={chartData} />
            <div style={{ height: "0.5px", backgroundColor: "var(--color-border)", marginBottom: "1rem" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {chartData.map((row) => {
                    const color = BMI_COLORS[row.range] ?? "#888780";
                    const widthPct = Math.round((row.count / max) * 100);
                    return (
                        <div key={row.range} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-muted)", width: "90px", flexShrink: 0, textAlign: "right" }}>
                                {row.range}
                            </span>
                            <AnimatedBar widthPct={widthPct} color={color} />
                            <span style={{ fontSize: "11px", fontWeight: 600, color, width: "28px", textAlign: "right", flexShrink: 0 }}>
                                {row.count}
                            </span>
                        </div>
                    );
                })}
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "12px" }}>
                {Object.entries(BMI_COLORS).map(([label, color]) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: color, flexShrink: 0 }} />
                        <span style={{ fontSize: "11px", color: "var(--color-muted)" }}>{label}</span>
                    </div>
                ))}
            </div>
        </AnalyticsChartCard>
    );
}
