import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { validateMeasurementValues } from "../constants/measurementRanges";

/**
 * Numeric entry for a set of measurement metrics.
 *
 * Deliberately mode-agnostic: it knows about metrics, bounds and values, but
 * nothing about Smart or Manual. Anything needing a person to type readings —
 * a staff correction screen, an admin override, a future measurement type —
 * can reuse it by passing a different `metrics`/`ranges` pair.
 */
export default function MeasurementValueForm({
    metrics,
    ranges,
    values,
    onChange,
    onSubmit,
    onInvalid,
    accent = "var(--color-primary)",
    accentContent = "var(--color-primary-content)",
    submitLabel = "Continue",
    disabled = false,
}) {
    const [touched, setTouched] = useState({});
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const firstFieldRef = useRef(null);

    // On a kiosk the person is standing at the screen with a reading in hand —
    // they should be able to type straight away rather than hunting for the
    // field first. Focuses the first metric once, on mount.
    useEffect(() => {
        const id = window.setTimeout(() => firstFieldRef.current?.focus(), 120);
        return () => window.clearTimeout(id);
    }, []);

    const errors = useMemo(
        () => validateMeasurementValues(ranges, metrics, values),
        [ranges, metrics, values],
    );

    const isValid = Object.keys(errors).length === 0;
    const showErrorFor = (key) => Boolean(errors[key]) && (submitAttempted || touched[key]);

    // Keep the field numeric without using type="number", whose scroll-wheel
    // and spinner behaviour is hostile on a touch kiosk. Allows one leading
    // minus and one decimal point so partial input like "36." stays editable.
    const sanitize = (raw) => {
        const cleaned = raw.replace(/[^0-9.]/g, "");
        const [head, ...rest] = cleaned.split(".");
        return rest.length ? `${head}.${rest.join("")}` : head;
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        setSubmitAttempted(true);

        if (!isValid) {
            // Surfaced to the caller so it can be announced; a voice user has
            // no other way to learn the entry was rejected.
            onInvalid?.(Object.values(errors));
            return;
        }
        if (disabled) return;

        const parsed = {};
        metrics.forEach((metric) => {
            parsed[metric.key] = Number(values[metric.key]);
        });
        onSubmit?.(parsed);
    };

    const single = metrics.length === 1;

    return (
        <form onSubmit={handleSubmit} noValidate>
            <div className={`mx-auto grid gap-4 ${single ? "max-w-sm grid-cols-1" : "max-w-2xl grid-cols-1 sm:grid-cols-2"}`}>
                {metrics.map((metric, metricIndex) => {
                    const range = ranges?.[metric.key];
                    const invalid = showErrorFor(metric.key);
                    const inputId = `measurement-field-${metric.key}`;

                    return (
                        <motion.div
                            key={metric.key}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.32, delay: metricIndex * 0.06, ease: [0.16, 1, 0.3, 1] }}
                            className="rounded-2xl sm:rounded-3xl border p-3 sm:p-5 text-center transition-colors"
                            style={{
                                backgroundColor: "var(--color-surface)",
                                borderColor: invalid
                                    ? "var(--color-error)"
                                    : `color-mix(in srgb, ${accent} 30%, var(--color-border))`,
                                boxShadow: invalid
                                    ? `0 0 0 3px color-mix(in srgb, var(--color-error) 14%, transparent)`
                                    : `0 0 0 3px color-mix(in srgb, ${accent} 8%, transparent)`,
                            }}
                        >
                            <label
                                htmlFor={inputId}
                                className="block text-xs font-black uppercase tracking-[0.16em]"
                                style={{ color: "var(--color-muted)" }}
                            >
                                {metric.label}
                            </label>

                            <div className="mt-3 flex items-baseline justify-center gap-2">
                                <input
                                    id={inputId}
                                    ref={metricIndex === 0 ? firstFieldRef : undefined}
                                    autoFocus={metricIndex === 0}
                                    type="text"
                                    inputMode="decimal"
                                    autoComplete="off"
                                    disabled={disabled}
                                    value={values?.[metric.key] ?? ""}
                                    onChange={(event) => onChange?.(metric.key, sanitize(event.target.value))}
                                    onBlur={() => setTouched((current) => ({ ...current, [metric.key]: true }))}
                                    placeholder="--"
                                    aria-invalid={invalid}
                                    aria-describedby={`${inputId}-hint`}
                                    className="w-full min-w-0 bg-transparent text-center text-2xl sm:text-3xl md:text-4xl font-black tabular-nums tracking-tighter outline-none disabled:opacity-60"
                                    style={{ color: "var(--color-text)" }}
                                />
                                <span className="shrink-0 text-base sm:text-lg md:text-xl font-medium" style={{ color: "var(--color-muted)" }}>
                                    {metric.unit}
                                </span>
                            </div>

                            <p
                                id={`${inputId}-hint`}
                                className="mt-3 flex items-start justify-center gap-1.5 text-xs font-semibold leading-5"
                                style={{ color: invalid ? "var(--color-error)" : "var(--color-muted)" }}
                            >
                                {invalid ? <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : null}
                                {invalid
                                    ? errors[metric.key]
                                    : range
                                        ? `Expected ${range.min}–${range.max} ${metric.unit}`
                                        : `Enter the ${metric.label.toLowerCase()} reading`}
                            </p>
                        </motion.div>
                    );
                })}
            </div>

            {/* Stays enabled while invalid on purpose: submitting is how the
                user asks "what's wrong?", and handleSubmit refuses the bad
                value anyway. Disabling it here stranded anyone who cleared a
                field after a failed attempt, with no way to re-trigger the
                messages. */}
            <button
                type="submit"
                disabled={disabled}
                className="mt-4 sm:mt-7 rounded-full px-6 py-3 sm:px-10 sm:py-4 text-sm sm:text-lg font-bold shadow-xl transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: accent, color: accentContent, boxShadow: `0 20px 25px -5px color-mix(in srgb, ${accent} 25%, transparent)` }}
            >
                {submitLabel}
            </button>
        </form>
    );
}
