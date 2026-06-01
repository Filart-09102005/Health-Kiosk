import { useMemo } from "react";
import { recordsAnalytics } from "../data/demoData";
import { cardClassName, cardStyle } from "../utils/surface";

function readColor(name, fallback) {
    if (typeof document === "undefined") return fallback;
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function percent(value, total) {
    return total ? Math.round((value / total) * 100) : 0;
}

function buildSegments(data, total) {
    let offset = 25;

    return data.map((item) => {
        const length = total ? (item.value / total) * 100 : 0;
        const segment = { ...item, offset, length };
        offset -= length;
        return segment;
    });
}

export default function HealthStatusDistribution() {
    const data = useMemo(() => {
        const rows = [
            { name: "Normal", value: recordsAnalytics.healthStatus[0].value, color: readColor("--color-success", "#1D9E75") },
            { name: "Watch", value: recordsAnalytics.healthStatus[1].value, color: readColor("--color-primary", "#378ADD") },
            { name: "Alert", value: recordsAnalytics.healthStatus[2].value, color: readColor("--color-error", "#E24B4A") },
        ];
        const total = rows.reduce((sum, item) => sum + item.value, 0);
        const maxValue = Math.max(...rows.map((item) => item.value));

        return {
            rows,
            total,
            maxValue,
            segments: buildSegments(rows, total),
        };
    }, []);

    return (
        <article className={`${cardClassName} p-4`} style={cardStyle}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-black">Health status distribution</p>
                    <p className="mt-1 text-xs font-semibold" style={{ color: "var(--color-muted)" }}>
                        Clinic-wide screening outcomes
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black">{data.total}</p>
                    <p className="text-[0.65rem] font-black uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
                        Total screened
                    </p>
                </div>
            </div>

            <div className="mt-5 grid items-center gap-5 sm:grid-cols-[8rem_1fr]">
                <div className="relative mx-auto h-28 w-28">
                    <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90" aria-hidden="true">
                        <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="var(--color-surface)" strokeWidth="5" />
                        {data.segments.map((segment) => (
                            <circle
                                key={segment.name}
                                cx="21"
                                cy="21"
                                r="15.9155"
                                fill="transparent"
                                stroke={segment.color}
                                strokeDasharray={`${segment.length} ${100 - segment.length}`}
                                strokeDashoffset={segment.offset}
                                strokeLinecap="round"
                                strokeWidth="5"
                            />
                        ))}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-xl font-black">{data.total}</span>
                        <span className="text-[0.62rem] font-bold" style={{ color: "var(--color-muted)" }}>screened</span>
                    </div>
                </div>

                <div className="space-y-3">
                    {data.rows.map((item) => {
                        const share = percent(item.value, data.total);
                        const width = data.maxValue ? Math.round((item.value / data.maxValue) * 100) : 0;

                        return (
                            <div key={item.name} className="grid grid-cols-[4rem_1fr_4.2rem] items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                                    <span className="text-xs font-black" style={{ color: "var(--color-muted)" }}>{item.name}</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-surface)" }}>
                                    <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: item.color }} />
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-black">{item.value}</span>
                                    <span className="ml-1 text-xs font-black" style={{ color: item.color }}>{share}%</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </article>
    );
}
