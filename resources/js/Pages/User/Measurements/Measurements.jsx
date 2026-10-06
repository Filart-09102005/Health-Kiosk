import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Activity, ArrowLeft, ArrowRight, Check, ClipboardCheck, HeartPulse, Ruler, Scale, ShieldCheck, Sparkles, Stethoscope, Thermometer, Wrench } from "lucide-react";
import Header from "../components/Header";
import PulseBorder from "../components/PulseBorder";
import { useToast } from "../../Global/Toast";
import { authService } from "../../Auth/services/authService";
import HeartRateFlow from "./HeartRate/HeartRateFlow";
import TemperatureFlow from "./Temperature/TemperatureFlow";
import HeightFlow from "./Height/HeightFlow";
import WeightFlow from "./Weight/WeightFlow";
import { measurementService } from "./services/measurementService";
import MeasurementsSkeleton, { MEASUREMENTS_SKELETON_MIN_MS } from "./components/MeasurementsSkeleton";
import { useAssistant } from "../AI-Assistant/context/AssistantProvider";
import { MEASUREMENT_PROMPT_KEYS, MODE_PROMPT_KEYS } from "../AI-Assistant/constants/assistantPrompts";
import SmartRecommendationScreen from "./components/SmartRecommendationScreen";
import MeasurementModeToggle from "./components/MeasurementModeToggle";
import MeasurementModeTransition from "./components/MeasurementModeTransition";
import { MEASUREMENT_MODES, useMeasurementMode } from "./hooks/useMeasurementMode";
import SmartModeUnavailableModal from "./components/SmartModeUnavailableModal";
import { isSmartEnabled, useMeasurementAvailability } from "../../../Global/measurementAvailability";
import axios from "axios";

export const measurementOptions = [
    { key: "heart_rate", title: "Heart Rate & SpO2", description: "Pulse and oxygen saturation using the oximeter.", icon: HeartPulse, Flow: HeartRateFlow, unit: "bpm / %", accent: "var(--color-error)", accentContent: "var(--color-error-content)" },
    { key: "temperature", title: "Temperature", description: "Infrared body temperature reading.", icon: Thermometer, Flow: TemperatureFlow, unit: "°C", accent: "var(--color-warning)", accentContent: "var(--color-warning-content)" },
    { key: "height", title: "Height", description: "Standing height from the ultrasonic sensor.", icon: Ruler, Flow: HeightFlow, unit: "cm", accent: "var(--color-info)", accentContent: "var(--color-info-content)" },
    { key: "weight", title: "Weight", description: "Weight from the load-cell platform.", icon: Scale, Flow: WeightFlow, unit: "kg", accent: "var(--color-success)", accentContent: "var(--color-success-content)" },
];
export const availableMeasurementKeys = new Set(["heart_rate", "temperature", "height", "weight"]);
export const availableMeasurementOptions = measurementOptions.filter((item) => availableMeasurementKeys.has(item.key));
export const isMeasurementAvailable = (key) => availableMeasurementKeys.has(key);

export default function Measurements({ navigate }) {
    const { showToast } = useToast();
    const { enabled: assistantEnabled, speak } = useAssistant();
    const [flowState, setFlowState] = useState("picker"); // picker | active | recommendation
    const [activeType, setActiveType] = useState(null);
    const [data, setData] = useState({ session: null, record: null });
    const [lastCompletedKey, setLastCompletedKey] = useState(null);
    const [loading, setLoading] = useState(true);
    const [skipping, setSkipping] = useState(false);
    const shouldReduceMotion = useReducedMotion();
    const { mode, setMode, getModeFor } = useMeasurementMode(data.session?.id);
    // The mode being switched to while the announcement overlay is on screen.
    const [pendingMode, setPendingMode] = useState(null);
    // Admin-controlled per-sensor Smart Mode availability. Not polled during a
    // running health check — the choice has already been made by then.
    const { availability } = useMeasurementAvailability(flowState !== "active");
    // The health check whose sensor is under maintenance, held while the
    // "Smart Mode Unavailable" dialog is up.
    const [smartBlockedKey, setSmartBlockedKey] = useState(null);

    const ActiveFlow = measurementOptions.find((item) => item.key === activeType)?.Flow;
    const smartBlockedOption = measurementOptions.find((item) => item.key === smartBlockedKey) || null;

    const requestModeChange = useCallback((next) => {
        setPendingMode((current) => (current || next === mode ? current : next));
    }, [mode]);

    const commitModeChange = useCallback(() => {
        setPendingMode((next) => {
            if (next) {
                setMode(next);
                // Announced at commit, not on tap, so the voice lands with the
                // overlay rather than ahead of it. speak() is a no-op unless
                // Assistant Mode is on, so no guard is needed here.
                speak(MODE_PROMPT_KEYS[next]);
            }
            return next;
        });
    }, [setMode, speak]);

    const finishModeChange = useCallback(() => setPendingMode(null), []);

    const openMeasurement = useCallback((key) => {
        setActiveType(key);
        setFlowState("active");
    }, []);

    /**
     * Single entry point for starting a health check.
     *
     * Only a Smart start can be refused — Manual Mode is the fallback and is
     * always available, so a person in Manual Mode is never stopped here.
     */
    const requestMeasurement = useCallback((key) => {
        if (mode === MEASUREMENT_MODES.SMART && !isSmartEnabled(availability, key)) {
            setSmartBlockedKey(key);
            return;
        }

        openMeasurement(key);
    }, [availability, mode, openMeasurement]);

    const startBlockedInManualMode = useCallback(() => {
        if (!smartBlockedKey) return;

        const key = smartBlockedKey;
        setSmartBlockedKey(null);
        // Switched directly rather than through requestModeChange: the person
        // has already been held up by a dialog, so the two-second mode
        // announcement overlay would only delay them further.
        setMode(MEASUREMENT_MODES.MANUAL);
        openMeasurement(key);
    }, [openMeasurement, setMode, smartBlockedKey]);


    const record = data.record;
    // We determine completed by looking at values, or just assuming if it's not missing/skipped
    const completedKeys = [
        record?.heart_rate && record?.spo2 ? "heart_rate" : null,
        record?.temperature ? "temperature" : null,
        record?.height ? "height" : null,
        record?.weight ? "weight" : null,
    ].filter(Boolean);
    const skippedKeys = record?.skipped_measurements || [];
    const remainingCount = availableMeasurementOptions.length - completedKeys.length - skippedKeys.length;

    useEffect(() => {
        let alive = true;
        let loadingTimer = null;
        const startedAt = window.performance.now();
        const controller = new AbortController();

        measurementService
            .summary(controller.signal)
            .then((response) => {
                if (alive) {
                    setData(response.data);
                    // Determine initial state based on progress
                    const rec = response.data.record;
                    if (rec) {
                        const c = [
                            rec.heart_rate && rec.spo2 ? "heart_rate" : null,
                            rec.temperature ? "temperature" : null,
                            rec.height ? "height" : null,
                            rec.weight ? "weight" : null,
                        ].filter(Boolean);
                        const s = rec.skipped_measurements || [];
                        const rem = availableMeasurementOptions.length - c.length - s.length;
                        
                        // Always land on the picker. Completion is handled when a
                        // reading is actually saved, which is the only moment the
                        // student should be moved on to the results.
                        if (rem === 0 || c.length > 0 || s.length > 0) {
                            setFlowState("picker");
                        }
                    }
                }
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

    useEffect(() => {
        if (flowState === "active") {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [flowState]);

    const logout = async () => {
        await authService.logout();
        showToast({ type: "info", title: "Logged out", message: "Your session has ended." });
        navigate("/login");
    };

    const handleSaved = (newRecord) => {
        setLastCompletedKey(activeType);
        setData((current) => ({ ...current, record: newRecord }));
        setActiveType(null);
        
        const c = [
            newRecord?.heart_rate && newRecord?.spo2 ? "heart_rate" : null,
            newRecord?.temperature ? "temperature" : null,
            newRecord?.height ? "height" : null,
            newRecord?.weight ? "weight" : null,
        ].filter(Boolean);
        const s = newRecord?.skipped_measurements || [];
        const rem = availableMeasurementOptions.length - c.length - s.length;
        
        if (rem === 0) {
            speak("All health checks are finished. Showing your results now.");
            setFlowState("picker");
            // The results screen is a page of its own, so the last saved reading
            // hands over to it rather than rendering a second summary here.
            window.setTimeout(() => navigate("/results"), 900);
        } else {
            speak("Measurement complete. Please select your next health check.");
            setFlowState("picker");
        }
    };

    const handleSkip = async (key) => {
        if (skipping) return;
        setSkipping(true);
        try {
            const response = await axios.post("/api/user/measurements/skip", { type: key });
            setData((current) => ({ ...current, record: response.data.record }));
            const newRecord = response.data.record;
            
            const c = [
                newRecord?.heart_rate && newRecord?.spo2 ? "heart_rate" : null,
                newRecord?.temperature ? "temperature" : null,
                newRecord?.height ? "height" : null,
                newRecord?.weight ? "weight" : null,
            ].filter(Boolean);
            const s = newRecord?.skipped_measurements || [];
            const rem = availableMeasurementOptions.length - c.length - s.length;
            
            setFlowState("picker");

            if (rem === 0) {
                window.setTimeout(() => navigate("/results"), 900);
            }
        } catch (error) {
            showToast({ type: "error", title: "Error", message: "Failed to skip measurement." });
        } finally {
            setSkipping(false);
        }
    };
    
    const handleSkipAllRemaining = () => {
        navigate("/results");
    };

    const renderContent = () => {
        if (flowState === "active" && ActiveFlow) {
            return (
                <ActiveFlow
                    mode={getModeFor(activeType)}
                    onBack={() => {
                        setActiveType(null);
                        setFlowState("picker");
                    }}
                    onDashboard={() => navigate("/user/dashboard")}
                    onSaved={handleSaved}
                />
            );
        }
        
        if (flowState === "recommendation") {
            return (
                <SmartRecommendationScreen
                    completedKeys={completedKeys}
                    skippedKeys={skippedKeys}
                    onSelectNext={requestMeasurement}
                    onSkip={handleSkip}
                    onFinish={handleSkipAllRemaining}
                />
            );
        }
        
        // Default to picker
        return (
            <MeasurementPicker
                data={data}
                completedKeys={completedKeys}
                lastCompletedKey={lastCompletedKey}
                navigate={navigate}
                onSelect={openMeasurement}
                speak={speak}
                assistantEnabled={assistantEnabled}
                mode={mode}
                onModeChange={requestModeChange}
                modeChanging={Boolean(pendingMode)}
                availability={availability}
                onSmartUnavailable={setSmartBlockedKey}
            />
        );
    };

    return (
        <>
        <MeasurementModeTransition
            mode={pendingMode}
            onCommit={commitModeChange}
            onComplete={finishModeChange}
        />
        <SmartModeUnavailableModal
            open={Boolean(smartBlockedOption)}
            measurement={smartBlockedOption}
            onUseManual={startBlockedInManualMode}
            onClose={() => setSmartBlockedKey(null)}
        />
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
                            className={flowState === "active" ? "pointer-events-none opacity-40 blur-sm select-none transition-all duration-500" : "transition-all duration-500"}
                        >
                            <Header
                                user={data.session?.user || { firstname: "Health", lastname: "Kiosk", role: "student", department: "COLLEGE" }}
                                onLogout={logout}
                                navigate={navigate}
                            />
                        </motion.div>
                        
                        {/* Global Progress Indicator */}
                        {true && (
                            <div className="mt-8 flex items-center justify-center gap-3">
                                <span className="text-sm font-bold uppercase tracking-widest text-[var(--color-muted)]">
                                    Progress
                                </span>
                                <div className="flex gap-2">
                                    {availableMeasurementOptions.map((opt) => {
                                        const isDone = completedKeys.includes(opt.key);
                                        const isSkipped = skippedKeys.includes(opt.key);
                                        return (
                                            <div 
                                                key={opt.key}
                                                className="flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold"
                                                style={{
                                                    backgroundColor: isDone ? "color-mix(in srgb, var(--color-success) 10%, transparent)" : (isSkipped ? "var(--color-surface)" : "transparent"),
                                                    borderColor: isDone ? "var(--color-success)" : "var(--color-border)",
                                                    color: isDone ? "var(--color-success)" : (isSkipped ? "var(--color-muted)" : "var(--color-text)")
                                                }}
                                            >
                                                {isDone ? <Check size={12} /> : (isSkipped ? <span className="opacity-50">○</span> : <span>○</span>)}
                                                {opt.title}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <section className="mt-8">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={flowState + activeType}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.4, ease: "easeInOut" }}
                                >
                                    {renderContent()}
                                </motion.div>
                            </AnimatePresence>
                        </section>
                    </div>
                </motion.main>
            )}
        </AnimatePresence>
        </>
    );
}

// Shows the exact value as stored — no rounding/truncation, so the preview
// never shows a number different from the real saved reading.
const formatRawNumber = (value) => {
    const num = Number(value);
    return Number.isNaN(num) ? null : String(num);
};

const formatResultPreview = (item, record) => {
    if (item.key === "heart_rate") {
        const hr = record?.heart_rate;
        const spo2 = record?.spo2;
        if (hr == null && spo2 == null) return null;
        const hrText = hr != null ? `${formatRawNumber(hr)} bpm` : "--";
        const spo2Text = spo2 != null ? `${formatRawNumber(spo2)}%` : "--";
        return `${hrText} · ${spo2Text}`;
    }

    const value = record?.[item.key];
    if (value === null || value === undefined || value === "") return null;
    const formatted = formatRawNumber(value);
    if (formatted === null) return null;
    return `${formatted} ${item.unit}`;
};

const isMeasurementAbnormal = (key, record) => {
    if (!record || !record.measurement_statuses) return false;
    
    if (key === "heart_rate") {
        const hrStatus = record.measurement_statuses['heart_rate'];
        const spo2Status = record.measurement_statuses['spo2'];
        const hrBad = hrStatus === 'Consult Clinic' || hrStatus === 'Watch';
        const spo2Bad = spo2Status === 'Consult Clinic' || spo2Status === 'Watch';
        return hrBad || spo2Bad;
    }

    const status = record.measurement_statuses[key];
    return status === 'Consult Clinic' || status === 'Watch';
};

function MeasurementPicker({ data, completedKeys, lastCompletedKey, onSelect, navigate, speak, assistantEnabled, mode, onModeChange, modeChanging, availability, onSmartUnavailable }) {
    const shouldReduceMotion = useReducedMotion();
    const progress = (completedKeys.length / measurementOptions.length) * 100;
    const isAllDone = completedKeys.length === availableMeasurementOptions.length;
    const record = data?.record;

    // Only meaningful in Smart Mode — Manual Mode can always be used, whatever
    // the administrator has switched off.
    const isSmartBlocked = (key) =>
        mode === MEASUREMENT_MODES.SMART && !isSmartEnabled(availability, key);

    const smartReadyCount = availableMeasurementOptions.filter((item) =>
        isSmartEnabled(availability, item.key),
    ).length;

    const selectMeasurement = (item) => {
        if (!isMeasurementAvailable(item.key)) {
            speak?.("This health check is not available because the sensor is not connected.");
            return;
        }
        const key = item.key;

        if (isSmartBlocked(key)) {
            speak?.("Smart Mode is unavailable for this health check. You can continue with Manual Mode.");
            onSmartUnavailable?.(key);
            return;
        }

        speak?.(MEASUREMENT_PROMPT_KEYS[key]);
        onSelect(key);
    };

    return (
        <>
            {/* ── Mode toggle ──
                Lives inside the picker on purpose: the picker unmounts while a
                health check is running, so the mode cannot be switched
                mid-measurement without any extra locking state. */}
            <motion.div
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="mb-5"
            >
                <MeasurementModeToggle mode={mode} onChange={onModeChange} disabled={modeChanging} />
            </motion.div>

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
                                {completedKeys.length} / {measurementOptions.length} health checks completed.
                                {" "}
                                {/* Sensor connectivity is only meaningful when readings actually
                                    come from the sensors. */}
                                {/* Kept word-for-word when every sensor is up;
                                    only a sensor actually taken down for
                                    maintenance changes the sentence. */}
                                {mode === MEASUREMENT_MODES.MANUAL
                                    ? "Readings are entered from an external device."
                                    : smartReadyCount === availableMeasurementOptions.length
                                        ? `${availableMeasurementOptions.length} sensors are connected now.`
                                        : `${smartReadyCount} of ${availableMeasurementOptions.length} sensors are available — the rest are under maintenance.`}
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
                    const done = completedKeys.includes(item.key);
                    const abnormal = isMeasurementAbnormal(item.key, record);
                    const unavailable = !isMeasurementAvailable(item.key);
                    // Sensor switched off by an admin. The card stays fully
                    // usable on purpose — tapping it offers Manual Mode.
                    const maintenance = !unavailable && !done && isSmartBlocked(item.key);
                    const resultPreview = formatResultPreview(item, record);

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
                            className={`group relative overflow-hidden rounded-[1.5rem] border text-left transition-shadow duration-300 ${unavailable ? "cursor-not-allowed opacity-70" : "hover:shadow-xl"}`}
                            style={{
                                backgroundColor: "var(--color-card)",
                                borderColor: done
                                    ? `color-mix(in srgb, var(--color-${abnormal ? 'error' : 'success'}) 35%, var(--color-border))`
                                    : "var(--color-border)",
                                boxShadow: done
                                    ? `0 0 0 1px color-mix(in srgb, var(--color-${abnormal ? 'error' : 'success'}) 18%, transparent), 0 2px 12px color-mix(in srgb, var(--color-${abnormal ? 'error' : 'success'}) 8%, transparent)`
                                    : "none",
                            }}
                        >
                            {done && <PulseBorder animate={lastCompletedKey === item.key} abnormal={abnormal} />}
                            <div className="relative z-10 p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div
                                            className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                                            style={{
                                                backgroundColor: done
                                                    ? `color-mix(in srgb, var(--color-${abnormal ? 'error' : 'success'}) 10%, var(--color-surface))`
                                                    : "var(--color-surface)",
                                            }}
                                        >
                                            <Icon
                                                size={26}
                                                style={{ color: done ? `var(--color-${abnormal ? 'error' : 'success'})` : "var(--color-primary)" }}
                                            />
                                        </div>
                                        {resultPreview && (
                                            <div className="min-w-0 leading-tight">
                                                <p
                                                    className="text-[10px] font-black uppercase tracking-wide"
                                                    style={{ color: "var(--color-muted)" }}
                                                >
                                                    Last result
                                                </p>
                                                <p
                                                    className="truncate text-sm font-black"
                                                    style={{ color: `var(--color-${abnormal ? 'error' : 'success'})` }}
                                                >
                                                    {resultPreview}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <span
                                        className="mt-0.5 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-black tracking-wide"
                                        style={{
                                            backgroundColor: done
                                                ? `color-mix(in srgb, var(--color-${abnormal ? 'error' : 'success'}) 10%, var(--color-surface))`
                                                : maintenance
                                                    ? "color-mix(in srgb, var(--color-warning) 12%, var(--color-surface))"
                                                    : "var(--color-surface)",
                                            color: done
                                                ? `var(--color-${abnormal ? 'error' : 'success'})`
                                                : maintenance
                                                    ? "var(--color-warning)"
                                                    : "var(--color-muted)",
                                        }}
                                    >
                                        {done && <Check size={10} strokeWidth={3} />}
                                        {maintenance && !done && <Wrench size={10} strokeWidth={3} />}
                                        {done ? "Done" : unavailable ? "Not connected" : maintenance ? "Maintenance" : "Ready"}
                                    </span>
                                </div>
                                <h3 className="mt-4 text-[15px] font-black leading-snug" style={{ letterSpacing: "-0.01em" }}>
                                    {item.title}
                                </h3>
                                <p className="mt-1.5 text-xs leading-5" style={{ color: "var(--color-muted)" }}>
                                    {unavailable ? `${item.title} is not available.` : item.description}
                                </p>
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
            </motion.div>
        </>
    );
}
