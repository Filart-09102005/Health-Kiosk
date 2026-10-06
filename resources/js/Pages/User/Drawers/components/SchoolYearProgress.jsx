import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
    CalendarRange, ChevronDown, Droplets, GraduationCap,
    HeartPulse, Ruler, Scale, Thermometer, TrendingUp,
} from "lucide-react";
import { buildSchoolYearGroups, statusTone } from "../utils/schoolYearProgress";

/**
 * School-Year Progress.
 *
 * The long-term half of the Health Journey: how the body changed across the
 * academic years. The Personal Health Timeline below it stays the visit-by-visit
 * record — this section summarises those visits rather than replacing them.
 */

const GROWTH_METRICS = [
    { key: "height", label: "Height", unit: "cm", decimals: 1, icon: Ruler },
    { key: "weight", label: "Weight", unit: "kg", decimals: 1, icon: Scale },
    { key: "bmi", label: "BMI", unit: "", decimals: 2, icon: TrendingUp },
];

const VITAL_METRICS = [
    { key: "heart_rate", label: "Avg. Heart Rate", unit: "BPM", decimals: 0, icon: HeartPulse },
    { key: "spo2", label: "Avg. SpO₂", unit: "%", decimals: 0, icon: Droplets },
    { key: "temperature", label: "Avg. Temperature", unit: "°C", decimals: 1, icon: Thermometer },
];

const fmt = (value, decimals = 1) =>
    value == null || !Number.isFinite(Number(value)) ? "--" : Number(value).toFixed(decimals);

export default function SchoolYearProgress({ records = [] }) {
    const shouldReduceMotion = useReducedMotion();
    const groups = useMemo(() => buildSchoolYearGroups(records), [records]);

    // Newest first: the year you are in is the one you care about.
    const ordered = useMemo(() => [...groups].reverse(), [groups]);

    const [expandedKey, setExpandedKey] = useState(null);

    if (!groups.length) return null;

    const yearsWithData = groups.filter((group) => group.hasData).length;

    return (
        <section
            className="space-y-4 rounded-3xl border p-4"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-black" style={{ color: "var(--color-text)" }}>
                        <GraduationCap size={15} style={{ color: "var(--color-primary)" }} />
                        School-Year Progress
                    </p>
                    <p className="mt-1 text-xs leading-5" style={{ color: "var(--color-muted)" }}>
                        How your body changed across each academic year. Growth uses your latest complete
                        reading of that year; vitals are averaged from completed screenings only.
                    </p>
                </div>
                <span
                    className="shrink-0 rounded-full px-3 py-1 text-xs font-black"
                    style={{ backgroundColor: "var(--color-surface)", color: "var(--color-primary)" }}
                >
                    {yearsWithData} {yearsWithData === 1 ? "year" : "years"}
                </span>
            </div>

            <div className="space-y-3">
                {ordered.map((group) => (
                    <SchoolYearCard
                        key={group.key}
                        group={group}
                        expanded={expandedKey === group.key}
                        onToggle={() =>
                            setExpandedKey((current) => (current === group.key ? null : group.key))
                        }
                        shouldReduceMotion={shouldReduceMotion}
                    />
                ))}
            </div>
        </section>
    );
}

function SchoolYearCard({ group, expanded, onToggle, shouldReduceMotion }) {
    if (!group.hasData) {
        return (
            <article
                className="rounded-2xl border border-dashed p-4"
                style={{ borderColor: "var(--color-border)", backgroundColor: "transparent" }}
            >
                <div className="flex items-center gap-2">
                    <CalendarRange size={14} style={{ color: "var(--color-muted)" }} />
                    <p className="text-xs font-black" style={{ color: "var(--color-muted)" }}>
                        {group.schoolYear}
                    </p>
                </div>
                <p className="mt-1.5 text-xs font-semibold leading-5" style={{ color: "var(--color-muted)" }}>
                    No measurement records for this academic year.
                </p>
            </article>
        );
    }

    return (
        <article
            className="overflow-hidden rounded-2xl border transition-colors"
            style={{
                backgroundColor: "var(--color-surface)",
                borderColor: expanded
                    ? "color-mix(in srgb, var(--color-primary) 32%, var(--color-border))"
                    : "var(--color-border)",
            }}
        >
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={expanded}
                className="flex w-full items-center gap-3 p-4 text-left transition hk-soft-hover"
            >
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black" style={{ color: "var(--color-text)" }}>
                            {group.schoolYear.replace("S.Y. ", "")}
                        </span>
                        {group.level ? (
                            <span
                                className="rounded-md border px-1.5 py-0.5 text-[10px] font-black"
                                style={{
                                    backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, var(--color-surface))",
                                    borderColor: "color-mix(in srgb, var(--color-primary) 28%, transparent)",
                                    color: "var(--color-primary)",
                                }}
                            >
                                {group.level}
                            </span>
                        ) : null}
                    </div>
                    <p className="mt-1 text-xs font-bold" style={{ color: "var(--color-muted)" }}>
                        {group.screenings} {group.screenings === 1 ? "completed check" : "completed checks"}
                        {group.incompleteCount > 0 ? (
                            <span style={{ opacity: 0.75 }}>
                                {" · "}
                                {group.incompleteCount} incomplete, not counted
                            </span>
                        ) : null}
                    </p>
                </div>

                <span
                    className="shrink-0 text-[0.65rem] font-black uppercase tracking-[0.14em]"
                    style={{ color: "var(--color-primary)" }}
                >
                    {expanded ? "Hide" : "View Details"}
                </span>
                <motion.span
                    animate={{ rotate: expanded ? 180 : 0 }}
                    transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="shrink-0"
                    style={{ color: "var(--color-muted)" }}
                >
                    <ChevronDown size={16} />
                </motion.span>
            </button>

            <AnimatePresence initial={false}>
                {expanded ? (
                    <motion.div
                        key="body"
                        initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={shouldReduceMotion ? undefined : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-4 px-4 pb-4">
                            <SummaryBlock
                                title="Growth"
                                caption="Latest complete reading this year"
                                metrics={GROWTH_METRICS}
                                read={(metric) => {
                                    const entry = group.growth[metric.key];
                                    return { value: entry?.value ?? null, delta: entry?.delta ?? null };
                                }}
                            />

                            <SummaryBlock
                                title="Vital Summary"
                                caption={`Averaged from ${group.screenings} completed ${group.screenings === 1 ? "check" : "checks"}`}
                                metrics={VITAL_METRICS}
                                read={(metric) => ({ value: group.vitals[metric.key]?.value ?? null, delta: null })}
                            />

                            <YearVisits records={group.records} />
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </article>
    );
}

function SummaryBlock({ title, caption, metrics, read }) {
    return (
        <div>
            <div className="mb-2 flex items-baseline justify-between gap-2">
                <p className="text-[0.65rem] font-black uppercase tracking-[0.16em]" style={{ color: "var(--color-muted)" }}>
                    {title}
                </p>
                <p className="text-[0.62rem] font-semibold" style={{ color: "var(--color-muted)", opacity: 0.8 }}>
                    {caption}
                </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
                {metrics.map((metric) => {
                    const { value, delta } = read(metric);
                    const Icon = metric.icon;
                    const hasDelta = delta != null && Math.abs(delta) >= 0.01;

                    return (
                        <div
                            key={metric.key}
                            className="rounded-xl p-2.5"
                            style={{ backgroundColor: "var(--color-card)" }}
                        >
                            <div className="flex items-center gap-1.5">
                                <Icon size={12} style={{ color: "var(--color-primary)" }} />
                                <span
                                    className="truncate text-[0.6rem] font-black uppercase tracking-[0.1em]"
                                    style={{ color: "var(--color-muted)" }}
                                >
                                    {metric.label}
                                </span>
                            </div>
                            <p className="mt-1.5 text-base font-black tabular-nums" style={{ color: value == null ? "var(--color-muted)" : "var(--color-text)" }}>
                                {fmt(value, metric.decimals)}
                                {value != null && metric.unit ? (
                                    <span className="ml-1 text-[0.62rem] font-bold" style={{ color: "var(--color-muted)" }}>
                                        {metric.unit}
                                    </span>
                                ) : null}
                            </p>
                            {/* Only shown when there were two readings to compare
                                within the year — otherwise there is no change to
                                report, and a "0" would imply there was. */}
                            {hasDelta ? (
                                <p
                                    className="mt-0.5 text-[0.62rem] font-black tabular-nums"
                                    style={{ color: delta > 0 ? "var(--color-success)" : "var(--color-warning)" }}
                                >
                                    {delta > 0 ? "+" : ""}
                                    {fmt(delta, metric.decimals)} this year
                                </p>
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function YearVisits({ records }) {
    return (
        <div>
            <p className="mb-2 text-[0.65rem] font-black uppercase tracking-[0.16em]" style={{ color: "var(--color-muted)" }}>
                Visits this year
            </p>
            <div className="space-y-1.5">
                {[...records].reverse().map((record) => (
                    <div
                        key={record.id}
                        className="flex items-center justify-between gap-3 rounded-xl px-3 py-2"
                        style={{ backgroundColor: "var(--color-card)" }}
                    >
                        <span className="min-w-0 truncate text-[0.68rem] font-bold" style={{ color: "var(--color-muted)" }}>
                            {record.date_label || record.full_date} · {record.time}
                        </span>
                        <span
                            className="shrink-0 rounded-md px-2 py-0.5 text-[0.6rem] font-black"
                            style={{
                                backgroundColor: `color-mix(in srgb, ${statusTone(record.status)} 14%, transparent)`,
                                color: statusTone(record.status),
                            }}
                        >
                            {record.status}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
