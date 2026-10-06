import { motion, useReducedMotion } from "framer-motion";
import { Activity, AlertCircle, AlertTriangle, CheckCircle2, FileText, HeartPulse, Ruler, Scale, Thermometer } from "lucide-react";
import { accentFor, healthStatusTone, toneFor } from "../utils/measurementStatus";

/**
 * Presentation for a finished health check, shared by the in-flow session
 * summary and the standalone results screen so the two cannot drift apart.
 */

const STATUS_ICONS = {
    Normal: CheckCircle2,
    Watch: AlertTriangle,
    Alert: AlertCircle,
    "Consult Clinic": AlertCircle,
    Incomplete: FileText,
};

const METRIC_ICONS = {
    heart_rate: HeartPulse,
    temperature: Thermometer,
    height: Ruler,
    weight: Scale,
    bmi: Activity,
};

const formatReading = (value, digits = 2) => {
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(digits) : null;
};

const hasReading = (value) => value !== null && value !== undefined && value !== "";

/**
 * Build the metric list straight off a record. Kept here so both screens show
 * the same five cards — the results screen previously hard-coded only heart
 * rate, SpO2 and weight, silently dropping temperature and height.
 */
export function buildSummaryMetrics(record = {}) {
    const heartRate = formatReading(record.heart_rate);
    const spo2 = formatReading(record.spo2);
    const skipped = record.skipped_measurements || [];

    return [
        {
            key: "heart_rate",
            title: "Heart Rate & SpO2",
            caption: "Pulse oximeter",
            value: heartRate && spo2 ? `${heartRate} / ${spo2}` : null,
            unit: "bpm / %",
            hasValue: hasReading(record.heart_rate) && hasReading(record.spo2),
        },
        {
            key: "temperature",
            title: "Temperature",
            caption: "Infrared sensor",
            value: formatReading(record.temperature),
            unit: "°C",
            hasValue: hasReading(record.temperature),
        },
        {
            key: "height",
            title: "Height",
            caption: "Ultrasonic sensor",
            value: formatReading(record.height),
            unit: "cm",
            hasValue: hasReading(record.height),
        },
        {
            key: "weight",
            title: "Weight",
            caption: "Load-cell platform",
            value: formatReading(record.weight),
            unit: "kg",
            hasValue: hasReading(record.weight),
        },
        {
            key: "bmi",
            title: "BMI",
            caption: record.bmi_category || "Calculated reading",
            value: formatReading(record.bmi),
            unit: "kg/m²",
            hasValue: hasReading(record.bmi),
        },
    ].map((metric) => ({ ...metric, skipped: skipped.includes(metric.key) }));
}

/** Large status badge with a halo tinted to the overall grade. */
export function HealthStatusHero({ status, sessionNumber, advice }) {
    const shouldReduceMotion = useReducedMotion();
    const tone = healthStatusTone(status);
    const Icon = STATUS_ICONS[status] || FileText;

    return (
        <div className="flex flex-col items-center text-center">
            <motion.div
                className="hk-status-halo flex h-24 w-24 items-center justify-center rounded-full border"
                style={{
                    "--hk-accent": tone.color,
                    backgroundColor: `color-mix(in srgb, ${tone.color} 12%, var(--color-card))`,
                    borderColor: `color-mix(in srgb, ${tone.color} 42%, var(--color-border))`,
                }}
                initial={shouldReduceMotion ? { scale: 1 } : { scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.45, ease: "easeOut" }}
            >
                <Icon size={44} style={{ color: tone.color }} />
            </motion.div>

            {sessionNumber ? (
                <p className="mt-6 text-xs font-black uppercase tracking-[0.28em]" style={{ color: "var(--color-muted)" }}>
                    Session #{sessionNumber}
                </p>
            ) : null}

            <h2 className="mt-3 text-5xl font-black tracking-tight md:text-6xl" style={{ color: tone.color }}>
                {tone.headline}
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-6" style={{ color: "var(--color-muted)" }}>
                {advice || tone.blurb}
            </p>
        </div>
    );
}

/**
 * One reading.
 *
 * No coloured outline: the border stays neutral and the status is carried by a
 * small pill and the metric's own tint, so five cards side by side read as one
 * set rather than a row of competing colours.
 */
export function HealthMetricCard({ metric, statuses, index = 0 }) {
    const shouldReduceMotion = useReducedMotion();
    const tone = toneFor(metric.key, statuses, metric.hasValue);
    const accent = accentFor(metric.key);
    const Icon = METRIC_ICONS[metric.key] || Activity;
    const skipped = !metric.hasValue && metric.skipped;

    return (
        <motion.article
            className="hk-premium-card relative overflow-hidden rounded-[1.75rem] border p-6"
            style={{
                "--hk-accent": accent,
                backgroundColor: "var(--color-card)",
                borderColor: "var(--color-border)",
            }}
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: shouldReduceMotion ? 0 : 0.42,
                delay: shouldReduceMotion ? 0 : index * 0.07,
                ease: "easeOut",
            }}
        >
            {/* A soft wash of the metric's own colour, so each card is
                recognisable at a glance without an outline. */}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full blur-2xl"
                style={{ backgroundColor: `color-mix(in srgb, ${accent} 22%, transparent)` }}
            />

            <div className="relative z-10 flex items-start justify-between gap-3">
                <span
                    className="flex h-11 w-11 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `color-mix(in srgb, ${accent} 14%, var(--color-surface))`, color: accent }}
                >
                    <Icon size={20} />
                </span>

                {(skipped || tone.label) ? (
                    <span
                        className="rounded-full px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em]"
                        style={{
                            backgroundColor: `color-mix(in srgb, ${tone.color} 14%, var(--color-surface))`,
                            color: tone.color,
                        }}
                    >
                        {skipped ? "Skipped" : tone.label}
                    </span>
                ) : null}
            </div>

            <h3 className="relative z-10 mt-5 text-sm font-black" style={{ color: "var(--color-text)" }}>
                {metric.title}
            </h3>
            <p className="relative z-10 mt-0.5 text-xs font-semibold" style={{ color: "var(--color-muted)" }}>
                {metric.caption}
            </p>

            <div className="relative z-10 mt-5 flex items-end gap-2">
                {metric.hasValue && metric.value ? (
                    <>
                        <span className="hk-tabular text-4xl font-black leading-none tracking-tight">{metric.value}</span>
                        <span className="pb-1 text-xs font-bold" style={{ color: "var(--color-muted)" }}>
                            {metric.unit}
                        </span>
                    </>
                ) : (
                    <span className="text-2xl font-black" style={{ color: "var(--color-muted)" }}>
                        {skipped ? "Skipped" : "--"}
                    </span>
                )}
            </div>
        </motion.article>
    );
}

/**
 * Placeholder that occupies the same boxes as the finished summary.
 *
 * The shapes match the hero and the five cards position for position, so the
 * page does not jump when the readings arrive.
 */
export function HealthSummarySkeleton() {
    const bar = (w, h = "0.75rem") => (
        <span className="block rounded-full hk-skeleton" style={{ width: w, height: h }} />
    );

    return (
        <div aria-busy="true" aria-label="Loading your results">
            <div className="flex flex-col items-center gap-4 px-6 pt-12 pb-10 md:px-12">
                <span className="h-24 w-24 rounded-full hk-skeleton" />
                {bar("7rem", "0.7rem")}
                {bar("12rem", "2.4rem")}
                {bar("22rem", "0.8rem")}
            </div>

            <div
                className="border-t px-6 py-10 md:px-12"
                style={{ borderColor: "var(--color-border)", backgroundColor: "color-mix(in srgb, var(--color-surface) 55%, var(--color-card))" }}
            >
                <div className="mb-6 flex flex-col gap-2">
                    {bar("8rem", "0.7rem")}
                    {bar("14rem", "1.4rem")}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {[0, 1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="rounded-[1.75rem] border p-6"
                            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                        >
                            <div className="flex items-start justify-between">
                                <span className="h-11 w-11 rounded-2xl hk-skeleton" />
                                <span className="h-6 w-16 rounded-full hk-skeleton" />
                            </div>
                            <div className="mt-5 flex flex-col gap-2">
                                {bar("6rem", "0.8rem")}
                                {bar("8rem", "0.65rem")}
                            </div>
                            <div className="mt-5">{bar("5.5rem", "2rem")}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* The actions are part of the summary, so they wait with it —
                otherwise three live buttons sit under a loading placeholder and
                invite a press before there is anything to print. */}
            <div
                className="flex flex-col gap-3 border-t px-6 py-8 sm:flex-row sm:justify-center md:px-12"
                style={{ borderColor: "var(--color-border)" }}
            >
                <span className="h-[3.25rem] w-full rounded-2xl hk-skeleton sm:w-44" />
                <span className="h-[3.25rem] w-full rounded-2xl hk-skeleton sm:w-52" />
                <span className="h-[3.25rem] w-full rounded-2xl hk-skeleton sm:w-52" />
            </div>
        </div>
    );
}

/** The five-card reading grid. */
export function HealthMetricGrid({ metrics, statuses }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.map((metric, index) => (
                <HealthMetricCard key={metric.key} metric={metric} statuses={statuses} index={index} />
            ))}
        </div>
    );
}
