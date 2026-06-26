import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Activity, ArrowLeft, ArrowRight, Check, ClipboardCheck, HeartPulse, Ruler, Scale, ShieldCheck, Sparkles, Stethoscope, Thermometer } from "lucide-react";
import Header from "../components/Header";
import { useToast } from "../../Global/Toast";
import { authService } from "../../Auth/services/authService";
import HeartRateFlow from "./HeartRate/HeartRateFlow";
import TemperatureFlow from "./Temperature/TemperatureFlow";
import HeightFlow from "./Height/HeightFlow";
import WeightFlow from "./Weight/WeightFlow";
import { measurementService } from "./services/measurementService";
import MeasurementsSkeleton, { MEASUREMENTS_SKELETON_MIN_MS } from "./components/MeasurementsSkeleton";
import { useAssistant } from "../AI-Assistant/context/AssistantProvider";
import { MEASUREMENT_PROMPT_KEYS } from "../AI-Assistant/constants/assistantPrompts";

const measurementOptions = [
    { key: "heart_rate", title: "Heart Rate & SpO2", description: "Pulse and oxygen saturation using the oximeter.", icon: HeartPulse, Flow: HeartRateFlow, unit: "bpm / %", accent: "#ef4444" },
    { key: "temperature", title: "Temperature", description: "Infrared body temperature reading.", icon: Thermometer, Flow: TemperatureFlow, unit: "°C", accent: "#f97316" },
    { key: "height", title: "Height", description: "Standing height from the ultrasonic sensor.", icon: Ruler, Flow: HeightFlow, unit: "cm", accent: "#f59e0b" },
    { key: "weight", title: "Weight", description: "Weight from the load-cell platform.", icon: Scale, Flow: WeightFlow, unit: "kg", accent: "#10b981" },
];
const availableMeasurementKeys = new Set(["heart_rate", "temperature", "height", "weight"]);
const availableMeasurementOptions = measurementOptions.filter((item) => availableMeasurementKeys.has(item.key));
const isMeasurementAvailable = (key) => availableMeasurementKeys.has(key);

export default function Measurements({ navigate }) {
    const { showToast } = useToast();
    const { enabled: assistantEnabled, speak } = useAssistant();
    const [activeType, setActiveType] = useState(null);
    const [data, setData] = useState({ session: null, record: null });
    const [loading, setLoading] = useState(true);
    const [showPickerHints, setShowPickerHints] = useState(false);
    const shouldReduceMotion = useReducedMotion();
    const ActiveFlow = measurementOptions.find((item) => item.key === activeType)?.Flow;
    const allMeasurementsComplete = Boolean(
        data.record?.heart_rate &&
        data.record?.spo2 &&
        data.record?.weight,
    );

    useEffect(() => {
        let alive = true;
        let loadingTimer = null;
        const startedAt = window.performance.now();
        const controller = new AbortController();

        measurementService
            .summary(controller.signal)
            .then((response) => {
                if (alive) setData(response.data);
            })
            .catch((error) => {
                if (error.name !== "CanceledError") {
                    showToast({ type: "error", title: "Session unavailable", message: "Please log in again." });
                }
            })
            .finally(() => {
                if (!alive) return;
                const elapsed = window.performance.now() - startedAt;
                const remaining = Math.max(MEASUREMENTS_SKELETON_MIN_MS - elapsed, 0);
                loadingTimer = window.setTimeout(() => {
                    if (alive) setLoading(false);
                }, remaining);
            });

        return () => {
            alive = false;
            if (loadingTimer) window.clearTimeout(loadingTimer);
            controller.abort();
        };
    }, [showToast]);

    const logout = async () => {
        await authService.logout();
        showToast({ type: "info", title: "Logged out", message: "Your session has ended." });
        navigate("/login");
    };

    const handleSaved = (record, measurementTitle) => {
        setData((current) => ({ ...current, record }));
        setActiveType(null);
        const complete = Boolean(record?.heart_rate && record?.spo2 && record?.weight);
        if (complete) {
            speak(`${measurementTitle || "Measurement"} complete. All health checks are finished. Please press Review Results to view and print your health result.`);
        } else {
            speak(`${measurementTitle || "Measurement"} complete. Please continue with another health check, or review your results when all measurements are finished.`);
        }
    };

    useEffect(() => {
        if (loading || activeType || !assistantEnabled) {
            setShowPickerHints(false);
            return undefined;
        }
        setShowPickerHints(true);
        const timer = window.setTimeout(() => setShowPickerHints(false), 8000);
        return () => window.clearTimeout(timer);
    }, [activeType, assistantEnabled, loading]);

    return (
        <AnimatePresence mode="wait" initial={false}>
            {loading ? (
                <MeasurementsSkeleton key="measurements-skeleton" />
            ) : (
                <motion.main
                    key="measurements-content"
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 0.28, ease: "easeOut" }}
                    className="hk-page min-h-screen"
                    style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
                >
                    {/* Subtle ambient background pattern */}
                    <div
                        className="pointer-events-none fixed inset-0 opacity-[0.025]"
                        style={{
                            backgroundImage: `radial-gradient(circle at 20% 20%, var(--color-primary) 0%, transparent 50%),
                                radial-gradient(circle at 80% 80%, var(--color-success) 0%, transparent 50%)`,
                            zIndex: 0,
                        }}
                    />

                    <div className="relative mx-auto max-w-7xl px-4 py-6" style={{ zIndex: 1 }}>
                        <motion.div
                            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 0.3, ease: "easeOut" }}
                        >
                            <Header
                                user={data.session?.user || { firstname: "Health", lastname: "Kiosk", role: "student", department: "COLLEGE" }}
                                onLogout={logout}
                                navigate={navigate}
                            />
                        </motion.div>

                        <section className="mt-8">
                            {ActiveFlow ? (
                                <ActiveFlow onBack={() => setActiveType(null)} onDashboard={() => navigate("/user/dashboard")} onSaved={handleSaved} showToast={showToast} />
                            ) : (
                                <MeasurementPicker
                                    data={data}
                                    navigate={navigate}
                                    onSelect={setActiveType}
                                    speak={speak}
                                    showHints={showPickerHints}
                                    allMeasurementsComplete={allMeasurementsComplete}
                                    assistantEnabled={assistantEnabled}
                                />
                            )}
                        </section>
                    </div>
                </motion.main>
            )}
        </AnimatePresence>
    );
}

function MeasurementPicker({ data, onSelect, navigate, speak, showHints, allMeasurementsComplete, assistantEnabled }) {
    const shouldReduceMotion = useReducedMotion();
    const record = data.record;
    const completed = [
        record?.heart_rate && record?.spo2 ? "heart_rate" : null,
        record?.weight ? "weight" : null,
    ].filter(Boolean);

    const progress = (completed.length / measurementOptions.length) * 100;
    const isAllDone = completed.length === availableMeasurementOptions.length;

    const selectMeasurement = (item) => {
        if (!isMeasurementAvailable(item.key)) {
            speak?.("This health check is not available because the sensor is not connected.");
            return;
        }
        const key = item.key;
        speak?.(MEASUREMENT_PROMPT_KEYS[key]);
        onSelect(key);
    };

    return (
        <>
            {/* ── Hero banner ── */}
            <motion.div
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative overflow-hidden rounded-[2rem] border"
                style={{
                    backgroundColor: "var(--color-card)",
                    borderColor: "var(--color-border)",
                    boxShadow: "0 1px 3px color-mix(in srgb, var(--color-text) 6%, transparent), 0 8px 40px color-mix(in srgb, var(--color-primary) 8%, transparent)",
                }}
            >
                {/* Top accent bar */}
                <div
                    className="h-1 w-full"
                    style={{
                        background: isAllDone
                            ? "linear-gradient(90deg, var(--color-success), color-mix(in srgb, var(--color-success) 60%, var(--color-primary)))"
                            : `linear-gradient(90deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 60%, var(--color-success)))`,
                        width: `${Math.max(progress, 4)}%`,
                        transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                />

                <div className="grid lg:grid-cols-[1fr_20rem]">
                    {/* Left: headline */}
                    <div className="relative p-7 md:p-10">
                        {/* Decorative rings */}
                        <div
                            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-[0.06]"
                            style={{ border: "40px solid var(--color-primary)" }}
                        />
                        <div
                            className="pointer-events-none absolute -right-8 top-8 h-36 w-36 rounded-full opacity-[0.04]"
                            style={{ border: "24px solid var(--color-primary)" }}
                        />

                        <div className="flex flex-wrap items-center gap-2">
                            <span
                                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wide"
                                style={{
                                    backgroundColor: "color-mix(in srgb, var(--color-primary) 8%, var(--color-card))",
                                    borderColor: "color-mix(in srgb, var(--color-primary) 22%, transparent)",
                                    color: "var(--color-primary)",
                                }}
                            >
                                <span
                                    className="h-1.5 w-1.5 rounded-full"
                                    style={{ backgroundColor: "var(--color-primary)" }}
                                />
                                Session #{data.session?.session_number || "—"}
                            </span>

                            <span
                                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold"
                                style={{
                                    backgroundColor: isAllDone
                                        ? "color-mix(in srgb, var(--color-success) 10%, var(--color-card))"
                                        : "color-mix(in srgb, var(--color-muted) 8%, var(--color-card))",
                                    borderColor: isAllDone
                                        ? "color-mix(in srgb, var(--color-success) 25%, transparent)"
                                        : "var(--color-border)",
                                    color: isAllDone ? "var(--color-success)" : "var(--color-muted)",
                                }}
                            >
                                {isAllDone ? <Check size={11} /> : null}
                                {isAllDone ? "Connected checks complete" : `${completed.length} of ${measurementOptions.length} checks`}
                            </span>
                        </div>

                        <h1
                            className="mt-5 text-4xl font-black leading-[1.1] tracking-tight md:text-5xl"
                            style={{ letterSpacing: "-0.03em" }}
                        >
                            Health
                            <br />
                            <span style={{ color: "var(--color-primary)" }}>Check</span>
                            &nbsp;Options
                        </h1>

                        <p className="mt-4 max-w-lg text-sm leading-7 md:text-base" style={{ color: "var(--color-muted)" }}>
                            Choose one available health check. The screen will tell you where to place your finger or how to stand on the scale before saving the final reading.
                        </p>

                        {/* Feature pills */}
                        <div className="mt-7 flex flex-wrap gap-2">
                            {[
                                [Sparkles, "Clear step-by-step guide"],
                                [Stethoscope, "Live device reading"],
                                [ShieldCheck, "Final result saved"],
                            ].map(([Icon, label]) => (
                                <span
                                    key={label}
                                    className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold"
                                    style={{
                                        backgroundColor: "var(--color-surface)",
                                        borderColor: "var(--color-border)",
                                        color: "var(--color-muted)",
                                    }}
                                >
                                    <Icon size={13} style={{ color: "var(--color-primary)" }} />
                                    {label}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Right: progress panel */}
                    <div
                        className="flex flex-col justify-between border-l p-7"
                        style={{
                            borderColor: "var(--color-border)",
                            backgroundColor: "var(--color-surface)",
                        }}
                    >
                        <div>
                            <p
                                className="text-[10px] font-black uppercase tracking-[0.18em]"
                                style={{ color: "var(--color-muted)" }}
                            >
                                Measurement Progress
                            </p>
                            <p className="mt-2 text-xs font-semibold leading-5" style={{ color: "var(--color-muted)" }}>
                                {completed.length} / {measurementOptions.length} health checks completed. {availableMeasurementOptions.length} sensors are connected now.
                            </p>
                            <div className="mt-3 flex items-end gap-2">
                                <span className="text-5xl font-black leading-none" style={{ letterSpacing: "-0.04em" }}>
                                    {completed.length}
                                </span>
                                <span className="mb-1 text-xl font-bold" style={{ color: "var(--color-muted)" }}>
                                    / {measurementOptions.length}
                                </span>
                            </div>

                            {/* Segmented progress bar */}
                            <div className="mt-4 flex gap-1.5">
                                {measurementOptions.map((opt) => {
                                    const done = completed.includes(opt.key);
                                    const unavailable = !isMeasurementAvailable(opt.key);
                                    return (
                                        <div
                                            key={opt.key}
                                            className="h-2.5 flex-1 overflow-hidden rounded-full transition-all duration-500"
                                            style={{ backgroundColor: "var(--color-border)" }}
                                        >
                                            <div
                                                className="h-full rounded-full transition-all duration-700"
                                                style={{
                                                    width: done || unavailable ? "100%" : "0%",
                                                    backgroundColor: done
                                                        ? "var(--color-success)"
                                                        : unavailable
                                                            ? "color-mix(in srgb, var(--color-muted) 34%, var(--color-border))"
                                                            : "var(--color-primary)",
                                                    opacity: unavailable ? 0.55 : 1,
                                                }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Available readings checklist */}
                            <div className="mt-5 space-y-2.5">
                                {measurementOptions.map((opt) => {
                                    const Icon = opt.icon;
                                    const done = completed.includes(opt.key);
                                    const unavailable = !isMeasurementAvailable(opt.key);
                                    return (
                                        <div key={opt.key} className="flex items-center gap-3">
                                            <div
                                                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
                                                style={{
                                                    backgroundColor: done
                                                        ? "color-mix(in srgb, var(--color-success) 12%, var(--color-card))"
                                                        : unavailable
                                                            ? "color-mix(in srgb, var(--color-muted) 8%, var(--color-card))"
                                                        : "var(--color-card)",
                                                    color: done ? "var(--color-success)" : "var(--color-muted)",
                                                    border: "1px solid",
                                                    borderColor: done
                                                        ? "color-mix(in srgb, var(--color-success) 30%, transparent)"
                                                        : "var(--color-border)",
                                                }}
                                            >
                                                {done ? <Check size={13} strokeWidth={2.5} /> : <Icon size={13} />}
                                            </div>
                                            <div className="min-w-0">
                                                <span
                                                    className="block truncate text-xs font-semibold"
                                                    style={{
                                                        color: done ? "var(--color-text)" : "var(--color-muted)",
                                                        opacity: done || !unavailable ? 1 : 0.72,
                                                    }}
                                                >
                                                    {opt.title}
                                                </span>
                                                {unavailable ? (
                                                    <span className="mt-0.5 block text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: "var(--color-muted)" }}>
                                                        Sensor not connected
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-6 rounded-xl border px-4 py-3" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                            <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--color-muted)" }}>
                                Health Status
                            </p>
                            <p className="mt-1 text-sm font-bold" style={{ color: isAllDone ? "var(--color-success)" : "var(--color-text)" }}>
                                {record?.health_status || "Awaiting connected readings"}
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ── Measurement cards ── */}
            <motion.div
                className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                initial="hidden"
                animate="show"
                variants={{
                    hidden: {},
                    show: {
                        transition: shouldReduceMotion
                            ? { staggerChildren: 0 }
                            : { delayChildren: 0.38, staggerChildren: 0.09 },
                    },
                }}
            >
                {measurementOptions.map((item) => {
                    const Icon = item.icon;
                    const done = completed.includes(item.key);
                    const unavailable = !isMeasurementAvailable(item.key);

                    return (
                        <motion.button
                            key={item.key}
                            type="button"
                            variants={{
                                hidden: shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 24 },
                                show: {
                                    opacity: 1,
                                    y: 0,
                                    transition: shouldReduceMotion
                                        ? { duration: 0.01 }
                                        : { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                                },
                            }}
                            whileHover={shouldReduceMotion || unavailable ? undefined : { y: -5, scale: 1.015 }}
                            whileTap={shouldReduceMotion || unavailable ? undefined : { scale: 0.985 }}
                            onClick={() => selectMeasurement(item)}
                            className={`group relative overflow-hidden rounded-[1.5rem] border text-left transition-shadow duration-300 ${unavailable ? "cursor-not-allowed opacity-70" : "hover:shadow-xl"} ${showHints && !done && !unavailable ? "hk-measurement-card-hint" : ""}`}
                            style={{
                                backgroundColor: "var(--color-card)",
                                borderColor: done
                                    ? "color-mix(in srgb, var(--color-success) 35%, var(--color-border))"
                                    : "var(--color-border)",
                                boxShadow: done
                                    ? "0 0 0 1px color-mix(in srgb, var(--color-success) 18%, transparent), 0 2px 12px color-mix(in srgb, var(--color-success) 8%, transparent)"
                                    : "none",
                            }}
                        >
                            {/* Done overlay strip */}
                            {done && (
                                <div
                                    className="absolute left-0 top-0 h-full w-1"
                                    style={{ backgroundColor: "var(--color-success)" }}
                                />
                            )}

                            {/* Ambient glow blob */}
                            <div
                                className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                                style={{
                                    backgroundColor: done
                                        ? "color-mix(in srgb, var(--color-success) 10%, transparent)"
                                        : "color-mix(in srgb, var(--color-primary) 10%, transparent)",
                                }}
                            />

                            <div className="p-5">
                                {/* Header row */}
                                <div className="flex items-start justify-between gap-3">
                                    <div
                                        className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                                        style={{
                                            backgroundColor: done
                                                ? "color-mix(in srgb, var(--color-success) 10%, var(--color-surface))"
                                                : "var(--color-surface)",
                                        }}
                                    >
                                        <Icon
                                            size={26}
                                            style={{ color: done ? "var(--color-success)" : "var(--color-primary)" }}
                                        />
                                    </div>

                                    <span
                                        className="mt-0.5 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-black tracking-wide"
                                        style={{
                                            backgroundColor: done
                                                ? "color-mix(in srgb, var(--color-success) 10%, var(--color-surface))"
                                                : "var(--color-surface)",
                                            color: done ? "var(--color-success)" : "var(--color-muted)",
                                        }}
                                    >
                                        {done && <Check size={10} strokeWidth={3} />}
                                        {done ? "Done" : unavailable ? "Not connected" : "Ready"}
                                    </span>
                                </div>

                                {/* Title + description */}
                                <h3 className="mt-4 text-[15px] font-black leading-snug" style={{ letterSpacing: "-0.01em" }}>
                                    {item.title}
                                </h3>
                                <p className="mt-1.5 text-xs leading-5" style={{ color: "var(--color-muted)" }}>
                                    {unavailable ? `${item.title} is not available because the sensor is not connected.` : item.description}
                                </p>

                                {/* Unit badge */}
                                <div className="mt-4 flex items-center gap-2">
                                    <div
                                        className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-bold"
                                        style={{
                                            backgroundColor: "var(--color-surface)",
                                            borderColor: "var(--color-border)",
                                            color: "var(--color-muted)",
                                        }}
                                    >
                                        <Activity
                                            size={12}
                                            style={{ color: done ? "var(--color-success)" : "var(--color-primary)" }}
                                        />
                                        {unavailable ? "Sensor not connected" : item.unit}
                                    </div>
                                </div>

                                {/* CTA row */}
                                <div
                                    className="mt-4 flex items-center justify-between border-t pt-4 text-xs font-black"
                                    style={{
                                        borderColor: "var(--color-border)",
                                        color: done ? "var(--color-success)" : "var(--color-primary)",
                                    }}
                                >
                                    <span>{done ? "Retake reading" : unavailable ? "Not available" : "Start health check"}</span>
                                    <ArrowRight
                                        size={15}
                                        className="transition-transform duration-200 group-hover:translate-x-1"
                                    />
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </motion.div>

            {/* ── Action bar ── */}
            <motion.div
                className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={shouldReduceMotion ? { duration: 0.01 } : { delay: 0.88, duration: 0.36, ease: "easeOut" }}
            >
                <button
                    type="button"
                    onClick={() => navigate("/user/dashboard")}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-4 text-sm font-black transition hk-soft-hover"
                    style={{
                        backgroundColor: "var(--color-card)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-text)",
                    }}
                >
                    <ArrowLeft size={16} />
                    Back to Dashboard
                </button>

                <button
                    type="button"
                    onClick={() => {
                        speak?.("results");
                        navigate("/results");
                    }}
                    className={`group inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-black text-white transition-all duration-300 hk-primary-hover ${assistantEnabled && allMeasurementsComplete ? "hk-flow-action-hint" : ""}`}
                    style={{
                        backgroundColor: "var(--color-primary)",
                        boxShadow: allMeasurementsComplete
                            ? "0 4px 24px color-mix(in srgb, var(--color-primary) 35%, transparent)"
                            : "none",
                    }}
                >
                    <ClipboardCheck size={16} />
                    Review Results
                    <ArrowRight
                        size={15}
                        className="transition-transform duration-200 group-hover:translate-x-1"
                    />
                </button>
            </motion.div>
        </>
    );
}
