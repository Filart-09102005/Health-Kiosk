import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Loader2, PencilLine, ShieldCheck, Wrench } from "lucide-react";
import { useToast } from "../../../Global/Toast";
import { getErrorMessage } from "../../../Auth/services/authService";
import {
    MEASUREMENT_CATALOG,
    measurementAvailabilityService,
    normalizeAvailability,
    DEFAULT_AVAILABILITY,
} from "../../../../Global/measurementAvailability";

/**
 * Per-sensor Smart Mode switchboard.
 *
 * Saves on toggle rather than through the page's Save button: taking a sensor
 * out of service is a maintenance action an admin does while standing at the
 * kiosk, and it should land the moment they flip it. Manual Mode is shown for
 * completeness but has no control — it is the fallback and is always on.
 */
export default function MeasurementAvailabilitySection() {
    const { showToast } = useToast();
    const [availability, setAvailability] = useState(DEFAULT_AVAILABILITY);
    const [loading, setLoading] = useState(true);
    // Which sensor has a save in flight, so only its own row shows a spinner.
    const [savingKey, setSavingKey] = useState(null);
    const aliveRef = useRef(true);

    useEffect(() => {
        aliveRef.current = true;
        const controller = new AbortController();

        measurementAvailabilityService
            .fetch(controller.signal)
            .then((response) => {
                if (!aliveRef.current) return;
                setAvailability(normalizeAvailability(response.data?.availability));
            })
            .catch((error) => {
                if (!aliveRef.current || error?.name === "CanceledError") return;
                showToast({
                    type: "error",
                    title: "Availability unavailable",
                    message: getErrorMessage(error, "Unable to load sensor availability right now."),
                });
            })
            .finally(() => {
                if (aliveRef.current) setLoading(false);
            });

        return () => {
            aliveRef.current = false;
            controller.abort();
        };
    }, [showToast]);

    const toggleSmart = useCallback(
        (key, label) => {
            if (savingKey) return;

            const next = !availability[key]?.smart_enabled;
            const previous = availability;

            // Optimistic: the switch moves under the finger, and reverts only
            // if the server refuses.
            setAvailability((current) => ({
                ...current,
                [key]: { ...current[key], smart_enabled: next },
            }));
            setSavingKey(key);

            measurementAvailabilityService
                .update({ [key]: { smart_enabled: next } })
                .then((response) => {
                    if (!aliveRef.current) return;
                    setAvailability(normalizeAvailability(response.data?.availability));
                    showToast({
                        type: next ? "success" : "info",
                        title: next ? "Smart Mode enabled" : "Smart Mode disabled",
                        message: next
                            ? `${label} will be read from the kiosk sensor again.`
                            : `${label} now falls back to Manual Mode until you re-enable it.`,
                    });
                })
                .catch((error) => {
                    if (!aliveRef.current) return;
                    setAvailability(previous);

                    // Carries the status through, so a failure names itself
                    // instead of falling back to an unhelpful generic line.
                    const status = error?.response?.status;
                    const fallback = status
                        ? `The server rejected the change (HTTP ${status}).`
                        : "Could not reach the server. Check your connection and try again.";

                    console.error("Measurement availability save failed", error);

                    showToast({
                        type: "error",
                        title: "Save failed",
                        message: getErrorMessage(error, fallback),
                    });
                })
                .finally(() => {
                    if (aliveRef.current) setSavingKey(null);
                });
        },
        [availability, savingKey, showToast],
    );

    const offline = MEASUREMENT_CATALOG.filter((item) => !availability[item.key]?.smart_enabled);

    return (
        <div className="space-y-5">
            <StatusBanner offlineLabels={offline.map((item) => item.label)} loading={loading} />

            <div className="grid gap-4 xl:grid-cols-2">
                {MEASUREMENT_CATALOG.map((item, index) => (
                    <MeasurementAvailabilityCard
                        key={item.key}
                        item={item}
                        index={index}
                        smartEnabled={availability[item.key]?.smart_enabled !== false}
                        saving={savingKey === item.key}
                        busy={Boolean(savingKey)}
                        loading={loading}
                        onToggle={() => toggleSmart(item.key, item.label)}
                    />
                ))}
            </div>
        </div>
    );
}

function StatusBanner({ offlineLabels, loading }) {
    const allOnline = offlineLabels.length === 0;
    const tone = allOnline ? "var(--color-success)" : "var(--color-warning)";
    const Icon = allOnline ? ShieldCheck : Wrench;

    return (
        <div
            className="flex flex-wrap items-center gap-3 rounded-[1.25rem] border px-5 py-4"
            style={{
                backgroundColor: `color-mix(in srgb, ${tone} 7%, var(--color-surface))`,
                borderColor: `color-mix(in srgb, ${tone} 26%, var(--color-border))`,
            }}
        >
            <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `color-mix(in srgb, ${tone} 15%, transparent)`, color: tone }}
            >
                <Icon size={17} />
            </span>
            <p className="min-w-0 text-sm font-bold leading-6">
                {loading
                    ? "Checking sensor availability…"
                    : allOnline
                        ? "All sensors are available in Smart Mode."
                        : `Under maintenance: ${offlineLabels.join(", ")}.`}
                <span className="ml-1 font-semibold" style={{ color: "var(--color-muted)" }}>
                    Manual Mode stays available for every measurement.
                </span>
            </p>
        </div>
    );
}

function MeasurementAvailabilityCard({ item, index, smartEnabled, saving, busy, loading, onToggle }) {
    const shouldReduceMotion = useReducedMotion();
    const Icon = item.icon;
    const switchId = `smart-mode-${item.key}`;

    return (
        <motion.article
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
                shouldReduceMotion
                    ? { duration: 0.01 }
                    : { duration: 0.4, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }
            }
            className="relative overflow-hidden rounded-[1.25rem] border p-5 transition-colors"
            style={{
                backgroundColor: "var(--color-surface)",
                borderColor: smartEnabled
                    ? `color-mix(in srgb, ${item.accent} 28%, var(--color-border))`
                    : "var(--color-border)",
            }}
        >
            {/* Sensor's own colour, dimmed out while it is offline so the grid
                reads at a glance. */}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-[3px] transition-opacity duration-300"
                style={{ backgroundColor: item.accent, opacity: smartEnabled ? 1 : 0.2 }}
            />

            <div className="flex items-start gap-3">
                <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors"
                    style={{
                        backgroundColor: smartEnabled
                            ? `color-mix(in srgb, ${item.accent} 13%, transparent)`
                            : "color-mix(in srgb, var(--color-muted) 12%, transparent)",
                        color: smartEnabled ? item.accent : "var(--color-muted)",
                    }}
                >
                    <Icon size={21} />
                </span>

                <div className="min-w-0">
                    <h4 className="text-base font-black tracking-tight">{item.label}</h4>
                    <p className="mt-1 text-xs font-semibold leading-5" style={{ color: "var(--color-muted)" }}>
                        {item.description}
                    </p>
                </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {/* Smart Mode — the only control on this screen. */}
                <div
                    className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3"
                    style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                >
                    <label htmlFor={switchId} className="min-w-0 cursor-pointer select-none">
                        <span className="block text-[0.65rem] font-black uppercase tracking-[0.16em]" style={{ color: "var(--color-muted)" }}>
                            Smart Mode
                        </span>
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.span
                                key={loading ? "loading" : smartEnabled ? "on" : "off"}
                                initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }}
                                transition={{ duration: 0.16 }}
                                className="mt-0.5 block text-sm font-black"
                                style={{ color: smartEnabled ? item.accent : "var(--color-muted)" }}
                            >
                                {loading ? "Checking…" : smartEnabled ? "Enabled" : "Under maintenance"}
                            </motion.span>
                        </AnimatePresence>
                    </label>

                    <button
                        id={switchId}
                        type="button"
                        role="switch"
                        aria-checked={smartEnabled}
                        aria-label={`Smart Mode for ${item.label}`}
                        disabled={loading || busy}
                        onClick={onToggle}
                        className="relative h-8 w-14 shrink-0 rounded-full border outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-offset-2"
                        style={{
                            backgroundColor: smartEnabled ? item.accent : "var(--color-border)",
                            borderColor: smartEnabled ? item.accent : "var(--color-border)",
                            boxShadow: smartEnabled
                                ? `0 6px 16px -8px color-mix(in srgb, ${item.accent} 90%, transparent)`
                                : "none",
                        }}
                    >
                        <motion.span
                            layout
                            transition={
                                shouldReduceMotion
                                    ? { duration: 0.01 }
                                    : { type: "spring", stiffness: 520, damping: 34 }
                            }
                            className="absolute top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm"
                            style={{ left: smartEnabled ? "1.75rem" : "0.25rem" }}
                        >
                            {saving ? (
                                <Loader2 size={13} className="animate-spin" style={{ color: item.accent }} />
                            ) : smartEnabled ? (
                                <Check size={13} style={{ color: item.accent }} />
                            ) : null}
                        </motion.span>
                    </button>
                </div>

                {/* Manual Mode — informational. There is no control here because
                    it is the fallback that keeps the kiosk usable. */}
                <div
                    className="flex items-center gap-3 rounded-2xl border px-4 py-3"
                    style={{
                        backgroundColor: "color-mix(in srgb, var(--color-info) 6%, var(--color-card))",
                        borderColor: "color-mix(in srgb, var(--color-info) 20%, var(--color-border))",
                    }}
                >
                    <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: "color-mix(in srgb, var(--color-info) 14%, transparent)", color: "var(--color-info)" }}
                    >
                        <PencilLine size={15} />
                    </span>
                    <div className="min-w-0">
                        <span className="block text-[0.65rem] font-black uppercase tracking-[0.16em]" style={{ color: "var(--color-muted)" }}>
                            Manual Mode
                        </span>
                        <span className="mt-0.5 block text-sm font-black" style={{ color: "var(--color-info)" }}>
                            Always available
                        </span>
                    </div>
                </div>
            </div>
        </motion.article>
    );
}
