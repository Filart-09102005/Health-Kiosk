import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { recordsAnalytics } from "../data/demoData";
import { cardClassName, cardStyle } from "../utils/surface";

function readColor(name, fallback) {
    if (typeof document === "undefined") return fallback;

    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

export default function HealthStatusDistribution() {
    const data = useMemo(
        () => [
            { name: "Normal", value: recordsAnalytics.healthStatus[0].value, color: readColor("--color-success", "#22c55e") },
            { name: "Watch", value: recordsAnalytics.healthStatus[1].value, color: readColor("--color-primary", "#3b82f6") },
            { name: "Alert", value: recordsAnalytics.healthStatus[2].value, color: readColor("--color-error", "#ef4444") },
        ],
        [],
    );

    return (
        <article className={`${cardClassName} p-4`} style={cardStyle}>
            <p className="text-sm font-black">Health status distribution</p>
            <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>Clinic-wide screening outcomes</p>
            <div className="mt-3 h-44">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={data} dataKey="value" nameKey="name" innerRadius={42} outerRadius={62} paddingAngle={3}>
                            {data.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "color-mix(in srgb, var(--color-card) 96%, transparent)",
                                border: "1px solid var(--color-border)",
                                borderRadius: "12px",
                                fontSize: "12px",
                                fontWeight: 700,
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </article>
    );
}
