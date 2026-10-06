import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { cardClassName, cardStyle } from "../../Dashboard/utils/surface";

/**
 * Categorical slots 1–3 from the reference palette, plus a neutral for the
 * rolled-up remainder. Validated with the data-viz validator against this app's
 * card surfaces (#ffffff light, #0b0b0b dark): both modes pass the lightness
 * band, chroma floor, CVD separation and normal-vision floor.
 *
 * Light aqua warns on contrast (2.82:1 vs white), which the method permits only
 * alongside visible labels — hence the legend carries name, count and share for
 * every slice, and identity is never colour-alone.
 */
const SERIES = [
    { light: "#2a78d6", dark: "#3987e5" },
    { light: "#eb6834", dark: "#d95926" },
    { light: "#1baf7a", dark: "#199e70" },
];
const OTHER = { light: "#9ca3af", dark: "#6b7280" };

const RADIUS = 54;
const STROKE = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
// 2px of surface between fills, per the mark spec. It matters more than usual
// here because the top two counts often tie — without a gap they read as one
// continuous arc.
const GAP = 2;

const slugify = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-");

export default function MostCommonAlerts({ alerts = [] }) {
    const [active, setActive] = useState(null);

    const { arcs, total } = useMemo(() => {
        const counts = {};
        alerts.forEach((alert) => {
            if (alert.alertType) counts[alert.alertType] = (counts[alert.alertType] || 0) + 1;
        });

        const ranked = Object.entries(counts)
            .map(([label, count]) => ({ label, count }))
            .sort((a, b) => b.count - a.count);

        const slices = ranked.slice(0, 3).map((item, index) => ({ ...item, color: SERIES[index] }));

        // Anything past the top three folds into one neutral slice rather than
        // being dropped — otherwise the ring would not add up to the whole.
        const restCount = ranked.slice(3).reduce((sum, item) => sum + item.count, 0);
        if (restCount > 0) slices.push({ label: "Other alerts", count: restCount, color: OTHER });

        const sum = slices.reduce((acc, item) => acc + item.count, 0);

        let offset = 0;
        const built = slices.map((slice) => {
            const length = sum ? (slice.count / sum) * CIRCUMFERENCE : 0;
            const arc = { ...slice, length, offset, share: sum ? (slice.count / sum) * 100 : 0 };
            offset += length;
            return arc;
        });

        return { arcs: built, total: sum };
    }, [alerts]);

    if (!arcs.length) {
        return (
            <article className={`${cardClassName} mt-6 p-4`} style={cardStyle}>
                <Heading />
                <p
                    className="mt-4 rounded-xl border px-3 py-2.5 text-xs font-bold"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-muted)" }}
                >
                    No alert records found.
                </p>
            </article>
        );
    }

    const focused = active ? arcs.find((arc) => arc.label === active) : null;

    return (
        <article className={`${cardClassName} mt-6 p-5`} style={cardStyle}>
            <Heading />

            <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
                <div className="relative shrink-0">
                    <svg
                        viewBox="0 0 140 140"
                        className="h-40 w-40 -rotate-90"
                        role="img"
                        aria-label={`Alert distribution: ${arcs.map((a) => `${a.label} ${a.count}`).join(", ")}`}
                    >
                        <circle cx="70" cy="70" r={RADIUS} fill="none" strokeWidth={STROKE} stroke="var(--color-surface)" />

                        {arcs.map((arc) => {
                            const dash = Math.max(arc.length - GAP, 0);
                            const dimmed = active !== null && active !== arc.label;

                            return (
                                <circle
                                    key={arc.label}
                                    cx="70" cy="70" r={RADIUS}
                                    fill="none"
                                    strokeWidth={active === arc.label ? STROKE + 4 : STROKE}
                                    stroke={`var(--alert-slice-${slugify(arc.label)})`}
                                    strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                                    strokeDashoffset={-arc.offset}
                                    style={{
                                        opacity: dimmed ? 0.35 : 1,
                                        transition: "opacity 0.18s ease, stroke-width 0.18s ease",
                                        cursor: "pointer",
                                    }}
                                    onMouseEnter={() => setActive(arc.label)}
                                    onMouseLeave={() => setActive(null)}
                                />
                            );
                        })}
                    </svg>

                    {/* The hole earns its place by holding the total, and the
                        focused count while hovering. */}
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black tabular-nums tracking-tight" style={{ color: "var(--color-text)" }}>
                            {focused ? focused.count : total}
                        </span>
                        <span className="text-[0.58rem] font-black uppercase tracking-[0.14em]" style={{ color: "var(--color-muted)" }}>
                            {focused ? `${focused.share.toFixed(0)}% of total` : "alerts"}
                        </span>
                    </div>
                </div>

                {/* Legend doubles as the value table: name, count and share are
                    all written out, so nothing depends on colour alone. */}
                <ul className="w-full min-w-0 space-y-1">
                    {arcs.map((arc) => (
                        <li
                            key={arc.label}
                            onMouseEnter={() => setActive(arc.label)}
                            onMouseLeave={() => setActive(null)}
                            className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors"
                            style={{ backgroundColor: active === arc.label ? "var(--color-surface)" : "transparent" }}
                        >
                            <span
                                aria-hidden="true"
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: `var(--alert-slice-${slugify(arc.label)})` }}
                            />
                            <span className="min-w-0 flex-1 truncate text-sm font-bold" style={{ color: "var(--color-text)" }}>
                                {arc.label}
                            </span>
                            <span className="shrink-0 text-sm font-black tabular-nums" style={{ color: "var(--color-text)" }}>
                                {arc.count}
                            </span>
                            <span className="w-12 shrink-0 text-right text-xs font-bold tabular-nums" style={{ color: "var(--color-muted)" }}>
                                {arc.share.toFixed(1)}%
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Slot colours declared per mode so both the OS setting and the
                theme toggle resolve, matching how the rest of the app themes. */}
            <style>{`
                :root {
                    ${arcs.map((arc) => `--alert-slice-${slugify(arc.label)}: ${arc.color.light};`).join("\n")}
                }
                @media (prefers-color-scheme: dark) {
                    :root:where(:not([data-theme="light"])) {
                        ${arcs.map((arc) => `--alert-slice-${slugify(arc.label)}: ${arc.color.dark};`).join("\n")}
                    }
                }
                :root[data-theme="dark"] {
                    ${arcs.map((arc) => `--alert-slice-${slugify(arc.label)}: ${arc.color.dark};`).join("\n")}
                }
            `}</style>
        </article>
    );
}

function Heading() {
    return (
        <div className="flex items-center gap-2">
            <AlertTriangle size={16} style={{ color: "var(--color-error)" }} />
            <p className="text-sm font-black">Most common alerts</p>
        </div>
    );
}
