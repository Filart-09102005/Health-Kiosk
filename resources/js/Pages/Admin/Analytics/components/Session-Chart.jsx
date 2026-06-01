// resources/js/Pages/Admin/Analytics/components/Session-Chart.jsx

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { sessionAnalytics } from "../data/demoData";
import { chartTooltipStyle, getChartTheme } from "../utils/chartTheme";
import AnalyticsChartCard from "./AnalyticsChartCard";

const ALLOWED = ["Completed", "Incomplete"];

function pct(value, total) {
    return total ? `${Math.round((value / total) * 100)}%` : "0%";
}

function CustomTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const entry = payload[0];
    return (
        <div
            style={{
                ...chartTooltipStyle,
                borderRadius: "10px",
                padding: "10px 14px",
                minWidth: "140px",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <span
                    style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "2px",
                        backgroundColor: entry.payload.color,
                        flexShrink: 0,
                    }}
                />
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text)" }}>
                    {entry.name}
                </span>
            </div>
            <div style={{ fontSize: "13px", color: "var(--color-muted)", paddingLeft: "14px" }}>
                {entry.value.toLocaleString()} sessions
            </div>
        </div>
    );
}

// ── Must be passed via label prop on <Pie>, not as a child ──────────────────
function DonutCenterLabel({ viewBox, total }) {
    if (!viewBox) return null;
    const { cx, cy } = viewBox;
    return (
        <>
            <text
                x={cx}
                y={cy - 6}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fontSize: "22px", fontWeight: 600, fill: "var(--color-text)" }}
            >
                {total.toLocaleString()}
            </text>
            <text
                x={cx}
                y={cy + 16}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fontSize: "11px", fill: "var(--color-muted)" }}
            >
                total
            </text>
        </>
    );
}

function LegendPanel({ chartData, total }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
            {chartData.map(({ name, value, color }) => (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span
                        style={{
                            width: "10px",
                            height: "10px",
                            borderRadius: "2px",
                            backgroundColor: color,
                            flexShrink: 0,
                        }}
                    />
                    <span style={{ fontSize: "12px", color: "var(--color-muted)", flex: 1 }}>
                        {name}
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text)" }}>
                        {value.toLocaleString()}
                        <span style={{ fontSize: "11px", fontWeight: 600, color, marginLeft: "4px" }}>
                            {pct(value, total)}
                        </span>
                    </span>
                </div>
            ))}
            <div style={{ height: "0.5px", backgroundColor: "var(--color-border)", margin: "2px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: "11px", color: "var(--color-muted)" }}>Total sessions</span>
                <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text)" }}>
                    {total.toLocaleString()}
                </span>
            </div>
        </div>
    );
}

export default function SessionChart({ data }) {
    const theme = useMemo(() => getChartTheme(), []);

    const chartData = useMemo(() => {
        const source = data?.length ? data : sessionAnalytics;
        return source
            .filter((item) => ALLOWED.includes(item.name))
            .map((item) => ({
                ...item,
                color: item.name === "Completed" ? theme.success : theme.primary,
            }));
    }, [data, theme]);

    const total = chartData.reduce((acc, d) => acc + d.value, 0);

    return (
        <AnalyticsChartCard
            title="Session analytics"
            description="Completed and incomplete kiosk sessions only."
            heightClass="h-[300px]"
        >
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", height: "100%" }}>
                {/* Donut needs an explicit pixel size — ResponsiveContainer won't */}
                {/* work inside a flex child without a fixed dimension on the wrapper */}
                <div style={{ width: "180px", height: "180px", flexShrink: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={54}
                                outerRadius={76}
                                paddingAngle={3}
                                startAngle={90}
                                endAngle={-270}
                                label={(props) => <DonutCenterLabel {...props} total={total} />}
                                labelLine={false}
                            >
                                {chartData.map((entry) => (
                                    <Cell
                                        key={entry.name}
                                        fill={entry.color}
                                        stroke="var(--color-surface)"
                                        strokeWidth={3}
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <LegendPanel chartData={chartData} total={total} />
            </div>
        </AnalyticsChartCard>
    );
}