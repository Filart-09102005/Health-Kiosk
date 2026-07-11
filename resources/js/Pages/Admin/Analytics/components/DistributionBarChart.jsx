/**
 * DistributionBarChart
 * A reusable, enhanced vertical bar chart for health measurement category distributions.
 * Uses Recharts BarChart with custom tooltip, glowing bars, percentage labels, and a legend table.
 *
 * Props:
 *  - title       {string}   Card heading
 *  - description {string}   Subtitle below heading
 *  - data        {Array}    Array of { name, count, percentage, color } objects
 *  - icon        {ReactNode} Optional lucide icon for the header badge
 *  - accentColor {string}   CSS variable string used for the "Needs Review" bar glow tint (optional)
 */

import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Activity } from "lucide-react";

// ─── Shared surface style ─────────────────────────────────────────────────────

const cardClassName = "rounded-2xl border shadow-xl backdrop-blur-xl transition";
const cardStyle = {
    backgroundColor: "color-mix(in srgb, var(--color-card) 94%, transparent)",
    borderColor: "var(--color-border)",
};

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function DistributionTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;

    const item = payload[0]?.payload;
    if (!item) return null;

    return (
        <div
            className="min-w-[10rem] rounded-[14px] border p-3 shadow-2xl"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
        >
            <div className="flex items-center gap-2">
                <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                        backgroundColor: item.color,
                        boxShadow: `0 0 8px color-mix(in srgb, ${item.color} 60%, transparent)`,
                    }}
                />
                <p className="text-sm font-black">{item.name}</p>
            </div>
            <p className="mt-2.5 text-2xl font-black leading-none" style={{ color: item.color }}>
                {item.count}
                <span className="ml-1 text-sm font-bold" style={{ color: "var(--color-muted)" }}>records</span>
            </p>
            <div className="mt-2 flex items-center gap-2">
                <div
                    className="h-1.5 flex-1 overflow-hidden rounded-full"
                    style={{ backgroundColor: "var(--color-surface)" }}
                >
                    <div
                        className="h-full rounded-full"
                        style={{
                            width: `${item.percentage || 0}%`,
                            backgroundColor: item.color,
                            transition: "width 0.3s ease",
                        }}
                    />
                </div>
                <span className="shrink-0 text-xs font-black" style={{ color: item.color }}>
                    {item.percentage || 0}%
                </span>
            </div>
            <p className="mt-1.5 text-[0.68rem] font-bold" style={{ color: "var(--color-muted)" }}>
                of filtered records
            </p>
        </div>
    );
}

// ─── Custom bar shape with gradient glow and rounded top ──────────────────────

function EnhancedBar(props) {
    const { x, y, width, height, color, isHovered } = props;
    if (!height || height <= 0) return null;

    const id = `bar-grad-${String(color).replace(/[^a-z0-9]/gi, "")}`;
    const radius = Math.min(10, width / 2);

    return (
        <g>
            <defs>
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={isHovered ? 1 : 0.95} />
                    <stop offset="100%" stopColor={color} stopOpacity={isHovered ? 0.72 : 0.58} />
                </linearGradient>
            </defs>
            {/* Track */}
            <rect
                x={x}
                y={0}
                width={width}
                height={y + height}
                rx={radius}
                fill={`color-mix(in srgb, ${color} 10%, var(--color-surface))`}
                style={{ filter: "none" }}
            />
            {/* Bar */}
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                rx={radius}
                fill={`url(#${id})`}
                style={{
                    filter: isHovered
                        ? `drop-shadow(0 0 14px color-mix(in srgb, ${color} 55%, transparent))`
                        : `drop-shadow(0 0 7px color-mix(in srgb, ${color} 30%, transparent))`,
                    transition: "filter 0.2s ease",
                }}
            />
        </g>
    );
}

// ─── Custom bar value label (colors each label to match its bar) ──────────────

function BarValueLabel({ x, y, width, value, index, data }) {
    if (!value || value <= 0) return null;
    const item = data?.[index];
    const color = item?.color || "var(--color-muted)";

    return (
        <text
            x={x + width / 2}
            y={y - 6}
            textAnchor="middle"
            fontSize={11}
            fontWeight={900}
            fill={color}
        >
            {value}
        </text>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DistributionBarChart({ title, description, data = [], icon: Icon = Activity }) {
    const total = data.reduce((sum, item) => sum + (Number(item.count) || 0), 0);
    const topItem = [...data].sort((a, b) => (b.count || 0) - (a.count || 0))[0];
    const riskTotal = data
        .filter((item) => {
            const n = String(item.name || "").toLowerCase();
            return (
                ["low", "high", "elevated", "overweight", "obese", "underweight"].some((k) => n.includes(k)) &&
                !n.includes("normal") &&
                !n.includes("healthy")
            );
        })
        .reduce((sum, item) => sum + (Number(item.count) || 0), 0);
    const riskPercent = total ? Math.round((riskTotal / total) * 100) : 0;

    const isEmpty = !data.length || total === 0;

    return (
        <article className={`${cardClassName} h-full p-5`} style={cardStyle}>
            {/* ── Header ── */}
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-base font-black">{title}</h3>
                    <p className="mt-1 text-sm font-bold leading-5" style={{ color: "var(--color-muted)" }}>
                        {description}
                    </p>
                </div>
                <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px]"
                    style={{ backgroundColor: "var(--color-surface)", color: "var(--color-primary)" }}
                >
                    <Icon size={17} />
                </span>
            </div>

            {/* ── Summary stats row ── */}
            <div className="mb-4 grid grid-cols-3 gap-2">
                {/* Filtered Records */}
                <div
                    className="rounded-[12px] border p-2.5"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                >
                    <p className="text-[0.62rem] font-black uppercase tracking-[0.12em]" style={{ color: "var(--color-muted)" }}>
                        Records
                    </p>
                    <p className="mt-1.5 text-xl font-black">{total}</p>
                </div>
                {/* Most Common */}
                <div
                    className="rounded-[12px] border p-2.5"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                >
                    <p className="text-[0.62rem] font-black uppercase tracking-[0.12em]" style={{ color: "var(--color-muted)" }}>
                        Most Common
                    </p>
                    <p className="mt-1.5 truncate text-sm font-black">{topItem?.name || "—"}</p>
                    <p className="text-[0.62rem] font-bold" style={{ color: topItem?.color || "var(--color-muted)" }}>
                        {topItem ? `${topItem.count} records` : "No data"}
                    </p>
                </div>
                {/* Needs Review */}
                <div
                    className="rounded-[12px] border p-2.5"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                >
                    <p className="text-[0.62rem] font-black uppercase tracking-[0.12em]" style={{ color: "var(--color-muted)" }}>
                        Needs Review
                    </p>
                    <p
                        className="mt-1.5 text-xl font-black"
                        style={{ color: riskPercent ? "var(--color-error)" : "var(--color-success)" }}
                    >
                        {riskPercent}%
                    </p>
                    <div
                        className="mt-1 h-1.5 overflow-hidden rounded-full"
                        style={{ backgroundColor: "var(--color-card)" }}
                    >
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${riskPercent}%`,
                                backgroundColor: riskPercent ? "var(--color-error)" : "var(--color-success)",
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* ── Chart area ── */}
            {isEmpty ? (
                <EmptyState />
            ) : (
                <>
                    <div
                        className="rounded-[16px] border p-4"
                        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                    >
                        <div className="h-52 w-full">
                            <ResponsiveContainer debounce={50} width="100%" height="100%">
                                <BarChart
                                    data={data}
                                    margin={{ top: 24, right: 8, left: -18, bottom: 4 }}
                                    barCategoryGap="32%"
                                >
                                    <XAxis
                                        dataKey="name"
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: "var(--color-muted)", fontSize: 10, fontWeight: 900 }}
                                        tickFormatter={(v) => {
                                            const s = String(v || "");
                                            return s.length > 10 ? `${s.slice(0, 9)}…` : s;
                                        }}
                                        interval={0}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: "var(--color-muted)", fontSize: 10, fontWeight: 900 }}
                                        width={28}
                                    />
                                    <Tooltip
                                        content={<DistributionTooltip />}
                                        cursor={{ fill: "transparent" }}
                                    />
                                    <Bar
                                        dataKey="count"
                                        radius={[10, 10, 4, 4]}
                                        barSize={38}
                                        isAnimationActive={false}
                                        label={<BarValueLabel data={data} />}
                                    >
                                        {data.map((item) => (
                                            <Cell
                                                key={item.name}
                                                fill={item.color}
                                                style={{
                                                    filter: `drop-shadow(0 0 8px color-mix(in srgb, ${item.color} 40%, transparent))`,
                                                }}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* ── Legend table ── */}
                    <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                        {data.map((item) => (
                            <div
                                key={item.name}
                                className="flex items-center justify-between gap-2 rounded-[10px] border px-3 py-2 transition"
                                style={{
                                    borderColor: "var(--color-border)",
                                    backgroundColor: "var(--color-surface)",
                                }}
                            >
                                <span
                                    className="inline-flex min-w-0 items-center gap-2 text-xs font-black"
                                    style={{ color: "var(--color-muted)" }}
                                >
                                    <span
                                        className="h-2.5 w-2.5 shrink-0 rounded-sm"
                                        style={{
                                            backgroundColor: item.color,
                                            boxShadow: `0 0 6px color-mix(in srgb, ${item.color} 50%, transparent)`,
                                        }}
                                    />
                                    <span className="truncate" style={{ color: item.color }}>{item.name}</span>
                                </span>
                                <span className="shrink-0 text-xs font-black" style={{ color: "var(--color-muted)" }}>
                                    {item.count}{" "}
                                    <span style={{ color: item.color }}>{item.percentage || 0}%</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </article>
    );
}

function EmptyState() {
    return (
        <div
            className="flex min-h-44 flex-col items-center justify-center rounded-[14px] border p-6 text-center"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-muted)" }}
        >
            <div
                className="mb-3 flex h-11 w-11 items-center justify-center rounded-[12px]"
                style={{ backgroundColor: "var(--color-card)", color: "var(--color-primary)" }}
            >
                <Activity size={18} />
            </div>
            <p className="text-sm font-black" style={{ color: "var(--color-text)" }}>No matching records found</p>
            <p className="mt-1 max-w-xs text-xs font-bold leading-5">No distribution data for the selected filters.</p>
        </div>
    );
}
