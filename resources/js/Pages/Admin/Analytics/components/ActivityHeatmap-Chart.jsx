// ActivityHeatmapChart.jsx
// Drop-in replacement — pass `data` prop or falls back to demo data.
// Fully supports light & dark mode via CSS custom properties.

import { useState } from "react";
import { useThemeMode } from "../../../../Global/ThemeToggle";
import AnalyticsChartCard from "./AnalyticsChartCard";

const HOUR_LABELS = ["7AM", "9AM", "11AM", "1PM", "3PM", "5PM", "7PM"];

// ─── Blue ramp (7 stops, light → dark) ───────────────────────────────────────
// Light mode avoids heavy deep blue; dark mode uses a softer blue ramp
// so cells stay vivid against a dark surface.
const LIGHT_RAMP = [
    [230, 241, 251],  // 0 – near-empty
    [181, 212, 244],
    [133, 183, 235],
    [55,  138, 221],
    [24,  95,  165],
    [12,  68,  124],
    [4,   44,  83],   // 6 – max
];

const DARK_RAMP = [
    [20,  40,  70],   // 0 – near-empty (dark bg-ish)
    [22,  72,  120],
    [24,  105, 160],
    [30,  140, 198],
    [55,  175, 220],
    [100, 210, 235],
    [180, 235, 250],  // 6 – max (bright on dark)
];

function interpolateRamp(ramp, intensity) {
    const scaled = intensity * (ramp.length - 1);
    const lo = ramp[Math.floor(scaled)];
    const hi = ramp[Math.min(Math.ceil(scaled), ramp.length - 1)];
    const t = scaled - Math.floor(scaled);
    return [
        Math.round(lo[0] + (hi[0] - lo[0]) * t),
        Math.round(lo[1] + (hi[1] - lo[1]) * t),
        Math.round(lo[2] + (hi[2] - lo[2]) * t),
    ];
}

function cellBg(intensity, isDark, isEmpty) {
    if (isEmpty) return "transparent";
    const ramp = isDark ? DARK_RAMP : LIGHT_RAMP;
    const [r, g, b] = interpolateRamp(ramp, intensity);
    return `rgb(${r},${g},${b})`;
}

function cellTextColor(intensity, isDark) {
    if (isDark) {
        // on dark, lower-intensity cells are dark bg → use light text early
        return intensity > 0.35 ? "#0a1929" : "rgba(255,255,255,0.75)";
    }
    if (intensity > 0.5) return "#ffffff";
    if (intensity > 0.2) return "#185FA5";
    return "rgba(0,0,0,0.6)";
}

// ─── Inline styles (theme-aware via CSS vars + JS isDark flag) ────────────────
const styles = {
    root: {
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
        width: "100%",
    },
    statsRow: {
        display: "flex",
        gap: "10px",
        marginBottom: "1.25rem",
    },
    stat: (isDark) => ({
        flex: 1,
        background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
        border: `0.5px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"}`,
        borderRadius: "10px",
        padding: "10px 14px",
    }),
    statVal: {
        fontSize: "18px",
        fontWeight: 700,
        color: "var(--color-text)",
        lineHeight: 1.2,
    },
    statLbl: {
        fontSize: "11px",
        color: "var(--color-muted)",
        marginTop: "2px",
    },
    divider: {
        height: "0.5px",
        background: "var(--color-border)",
        marginBottom: "1rem",
    },
    hourRow: {
        display: "grid",
        gridTemplateColumns: "2.5rem repeat(7, minmax(0, 1fr))",
        gap: "6px",
        marginBottom: "6px",
        alignItems: "center",
    },
    hourLabel: {
        fontSize: "10px",
        fontWeight: 700,
        letterSpacing: "0.05em",
        color: "var(--color-muted)",
        textAlign: "center",
        textTransform: "uppercase",
    },
    dayRow: {
        display: "grid",
        gridTemplateColumns: "2.5rem repeat(7, minmax(0, 1fr))",
        gap: "6px",
        marginBottom: "6px",
        alignItems: "center",
    },
    dayLabel: {
        fontSize: "11px",
        fontWeight: 700,
        color: "var(--color-text)",
        textAlign: "right",
        paddingRight: "6px",
    },
    cell: (isEmpty) => ({
        height: "36px",
        borderRadius: "7px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "11px",
        fontWeight: 700,
        cursor: "default",
        transition: "transform 0.13s ease, box-shadow 0.13s ease",
        border: isEmpty
            ? "0.5px solid var(--color-border)"
            : "none",
        position: "relative",
    }),
    legendRow: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginTop: "1rem",
    },
    legendLabel: {
        fontSize: "11px",
        color: "var(--color-muted)",
    },
    legendBar: {
        display: "flex",
        gap: "3px",
        flex: 1,
    },
    legendStep: {
        height: "7px",
        flex: 1,
        borderRadius: "2px",
    },
};

// ─── Cell component ────────────────────────────────────────────────────────────
function Cell({ value, intensity, isDark, dayLabel, hourLabel }) {
    const [hovered, setHovered] = useState(false);
    const isEmpty = value === 0;
    const bg = cellBg(intensity, isDark, isEmpty);
    const color = isEmpty
        ? "var(--color-muted)"
        : cellTextColor(intensity, isDark);

    return (
        <div
            style={{
                ...styles.cell(isEmpty),
                backgroundColor: bg,
                color,
                transform: hovered ? "scale(1.1)" : "scale(1)",
                boxShadow: hovered
                    ? isDark
                        ? "0 4px 14px rgba(0,0,0,0.5)"
                        : "0 4px 14px rgba(0,0,0,0.12)"
                    : "none",
                zIndex: hovered ? 2 : 1,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            title={`${dayLabel} · ${hourLabel} — ${value} measurements`}
        >
            {value || ""}
        </div>
    );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function ActivityHeatmapChart({ data, isDark }) {
    const { resolvedTheme } = useThemeMode();
    const activeIsDark = isDark !== undefined ? isDark : resolvedTheme === "dark";

    const chartData = data || [];
    const allVals = chartData.flatMap((r) => r.hours);
    const max = Math.max(1, ...allVals);
    const total = allVals.reduce((a, b) => a + b, 0);
    const activeVals = allVals.filter((v) => v > 0);
    const avg = activeVals.length ? Math.round(total / activeVals.length) : 0;
    const peakRow = chartData.length ? chartData.reduce((best, row) => {
        const rowMax = Math.max(...row.hours);
        return rowMax > Math.max(...best.hours) ? row : best;
    }, chartData[0]) : { day: "-", hours: [0] };
    const peakHourIdx = peakRow.hours.indexOf(Math.max(...peakRow.hours));
    const peakLabel = HOUR_LABELS[peakHourIdx];

    const LEGEND_STEPS = 7;

    return (
        <AnalyticsChartCard
            title="Measurement activity heatmap"
            description="Daily clinic activity intensity by hour"
            heightClass="h-auto"
        >
            <div style={styles.root}>
                {/* Stats */}
                <div style={styles.statsRow}>
                    {[
                        { val: total.toLocaleString(), lbl: "Total this week" },
                        { val: max, lbl: `Peak (${peakRow.day}, ${peakLabel})` },
                    ].map(({ val, lbl }) => (
                        <div key={lbl} style={styles.stat(activeIsDark)}>
                            <div style={styles.statVal}>{val}</div>
                            <div style={styles.statLbl}>{lbl}</div>
                        </div>
                    ))}
                </div>

                <div style={styles.divider} />

                {/* Hour headers */}
                <div style={styles.hourRow}>
                    <span />
                    {HOUR_LABELS.map((h) => (
                        <span key={h} style={styles.hourLabel}>{h}</span>
                    ))}
                </div>

                {/* Day rows */}
                {chartData.map((row) => (
                    <div key={row.day} style={styles.dayRow}>
                        <span style={styles.dayLabel}>{row.day}</span>
                        {row.hours.map((value, i) => (
                            <Cell
                                key={`${row.day}-${i}`}
                                value={value}
                                intensity={value / max}
                                isDark={activeIsDark}
                                dayLabel={row.day}
                                hourLabel={HOUR_LABELS[i]}
                            />
                        ))}
                    </div>
                ))}

                {/* Legend */}
                <div style={styles.legendRow}>
                    <span style={styles.legendLabel}>Low</span>
                    <div style={styles.legendBar}>
                        {Array.from({ length: LEGEND_STEPS }, (_, i) => {
                            const t = i / (LEGEND_STEPS - 1);
                            const ramp = activeIsDark ? DARK_RAMP : LIGHT_RAMP;
                            const [r, g, b] = interpolateRamp(ramp, t);
                            return (
                                <div
                                    key={i}
                                    style={{
                                        ...styles.legendStep,
                                        backgroundColor: i === 0
                                            ? "transparent"
                                            : `rgb(${r},${g},${b})`,
                                        border: i === 0
                                            ? "0.5px solid var(--color-border)"
                                            : "none",
                                    }}
                                />
                            );
                        })}
                    </div>
                    <span style={styles.legendLabel}>High</span>
                </div>
            </div>
        </AnalyticsChartCard>
    );
}
