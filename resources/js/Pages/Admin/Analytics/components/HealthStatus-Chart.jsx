// resources/js/Pages/Admin/Analytics/components/HealthStatus-Chart.jsx
// UI redesign — data/imports untouched.
// Donut (left) + legend panel (right), same pattern as SessionChart.

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { chartTooltipStyle, getChartTheme } from "../utils/chartTheme";
import AnalyticsChartCard from "./AnalyticsChartCard";

function pct(value, total) {
    return total ? `${Math.round((value / total) * 100)}%` : "0%";
}

function CustomTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const entry = payload[0];
    return (
        <div style={{ ...chartTooltipStyle, borderRadius: "10px", padding: "10px 14px", minWidth: "150px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: entry.payload.color, flexShrink: 0 }} />
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text)" }}>{entry.name}</span>
            </div>
            <div style={{ fontSize: "13px", color: "var(--color-muted)", paddingLeft: "14px" }}>
                {entry.value} patients
            </div>
        </div>
    );
}

function DonutCenterLabel({ viewBox, total }) {
    if (!viewBox) return null;
    const { cx, cy } = viewBox;
    return (
        <>
            <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="middle"
                style={{ fontSize: "20px", fontWeight: 600, fill: "var(--color-text)" }}>
                {total}
            </text>
            <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="middle"
                style={{ fontSize: "10px", fill: "var(--color-muted)" }}>
                screened
            </text>
        </>
    );
}

function LegendPanel({ data, total }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
            {data.map(({ name, value, color }) => (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: color, flexShrink: 0 }} />
                    <span style={{ fontSize: "12px", color: "var(--color-muted)", flex: 1 }}>{name}</span>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text)" }}>
                        {value}
                        <span style={{ fontSize: "10px", fontWeight: 600, color, marginLeft: "4px" }}>{pct(value, total)}</span>
                    </span>
                </div>
            ))}
            <div style={{ height: "0.5px", backgroundColor: "var(--color-border)", margin: "2px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: "11px", color: "var(--color-muted)" }}>Total screened</span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text)" }}>{total}</span>
            </div>
        </div>
    );
}

export default function HealthStatusChart() {
    const theme = useMemo(() => getChartTheme(), []);

    const data = useMemo(() => [
        { name: "Normal",       value: 214, color: theme.success },
        { name: "Needs Review", value: 26,  color: theme.primary },
        { name: "High Risk",    value: 18,  color: theme.error   },
        { name: "Incomplete",   value: 12,  color: theme.muted   },
    ], [theme]);

    const total = data.reduce((acc, d) => acc + d.value, 0);

    return (
        <AnalyticsChartCard
            title="Health status distribution"
            description="Health result categories across completed screenings."
            heightClass="h-auto"
        >
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                <div style={{ width: "160px", height: "160px", flexShrink: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={52}
                                outerRadius={74}
                                paddingAngle={3}
                                startAngle={90}
                                endAngle={-270}
                                label={(props) => <DonutCenterLabel {...props} total={total} />}
                                labelLine={false}
                            >
                                {data.map((entry) => (
                                    <Cell key={entry.name} fill={entry.color} stroke="var(--color-surface)" strokeWidth={3} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <LegendPanel data={data} total={total} />
            </div>
        </AnalyticsChartCard>
    );
}