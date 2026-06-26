import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
    ArrowLeft, ArrowRight, Check, CheckCircle2, CircleDot,
    Gauge, Hand, RotateCcw, Save, ShieldCheck, Sparkles,
} from "lucide-react";
import useMeasurementSimulation from "../hooks/useMeasurementSimulation";
import { measurementService } from "../services/measurementService";
import { useAssistant } from "../../AI-Assistant/context/AssistantProvider";

const flowSteps = ["Instructions", "Positioning", "Reading", "Result", "Save"];
const LIVE_SENSOR_TIMEOUT_MS = 5000;
const stepCopy = [
    {
        eyebrow: "Before You Start",
        title: "Get ready for this reading",
        helper: "Read the instruction before pressing Continue.",
        visual: "intro",
    },
    {
        eyebrow: "Body Position",
        title: "Follow the correct position",
        helper: "Place your body or finger as shown, then keep still.",
        visual: "position",
    },
    {
        eyebrow: "Live Reading",
        title: "Hold still while the value stabilizes",
        helper: "Wait until the kiosk detects a stable final value.",
        visual: "reading",
    },
    {
        eyebrow: "Review Result",
        title: "Review the captured value",
        helper: "Confirm the reading looks right before saving it.",
        visual: "result",
    },
    {
        eyebrow: "Save Result",
        title: "Store this reading",
        helper: "This value will be saved as part of your health result.",
        visual: "save",
    },
];
const fallbackConfig = {
    type: "measurement",
    icon: Gauge,
    title: "Measurement",
    description: "",
    instructions: "",
    positioning: "",
    sensor: "",
    unit: "",
    format: () => "--",
};
const sensorStartCommands = {
    heart_rate: "START_OXIMETER",
    weight: "START_WEIGHT",
};

export default function MeasurementFlowShell({ config, onBack, onDashboard, onSaved, showToast }) {
    const safeConfig = config ?? fallbackConfig;
    const { enabled: assistantEnabled, speak } = useAssistant();
    const shouldReduceMotion = useReducedMotion();
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [readingAttempt, setReadingAttempt] = useState(0);
    const [capturedReading, setCapturedReading] = useState(null);
    const spokenStepRef = useRef(null);
    const spokenReadingErrorRef = useRef(null);
    const commandKeyRef = useRef(null);
    const isReading = step === 2;
    const reading = useMeasurementReading(safeConfig.type, isReading, readingAttempt);
    const lockReadingFocus = isReading && !reading.error && !reading.stabilized;
    const Icon = safeConfig.icon;
    const startCommand = sensorStartCommands[safeConfig.type] ?? null;

    useEffect(() => {
        if (step !== 2 || !startCommand) return;

        const commandKey = `${safeConfig.type}-${readingAttempt}`;
        if (commandKeyRef.current === commandKey) return;

        commandKeyRef.current = commandKey;
        measurementService
            .resetLiveVitals()
            .then(() => measurementService.command(startCommand))
            .catch(() => {
                showToast?.({
                    type: "error",
                    title: "Sensor command failed",
                    message: "Please check that the Arduino bridge is running, then try again.",
                });
            });
    }, [readingAttempt, safeConfig.type, showToast, startCommand, step]);

    useEffect(() => {
        if (step !== 2 || !reading.stabilized || reading.error) return;
        setCapturedReading({
            value: reading.value,
            secondaryValue: reading.secondaryValue,
            source: reading.source,
        });
        const timer = window.setTimeout(() => setStep(3), 1200);
        return () => window.clearTimeout(timer);
    }, [reading.error, reading.secondaryValue, reading.source, reading.stabilized, reading.value, step]);

    useEffect(() => {
        setCapturedReading(null);
    }, [readingAttempt, safeConfig.type]);

    useEffect(() => {
        if (!lockReadingFocus) return undefined;

        const previousOverflow = document.body.style.overflow;
        const previousHtmlOverflow = document.documentElement.style.overflow;
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
            document.documentElement.style.overflow = previousHtmlOverflow;
        };
    }, [lockReadingFocus]);

    const save = async () => {
        const readingToSave = capturedReading ?? (reading.stabilized && !reading.error ? reading : null);
        const hasPrimaryValue = Number.isFinite(Number(readingToSave?.value)) && Number(readingToSave?.value) > 0;
        const hasRequiredSecondaryValue = safeConfig.type !== "heart_rate"
            || (Number.isFinite(Number(readingToSave?.secondaryValue)) && Number(readingToSave?.secondaryValue) > 0);

        if (!hasPrimaryValue || !hasRequiredSecondaryValue) {
            showToast?.({
                type: "error",
                title: "No valid reading",
                message: "Please complete a stable reading before saving.",
            });
            return;
        }

        setSaving(true);
        try {
            const response = await measurementService.save({
                type: safeConfig.type,
                value: readingToSave.value,
                secondary_value: readingToSave.secondaryValue,
                unit: safeConfig.unit,
                metadata: { simulated: readingToSave.source !== "live", source: readingToSave.source, sensor: safeConfig.sensor },
            });
            showToast?.({
                type: "success",
                title: "Measurement saved",
                message: `${safeConfig.title} was saved to this kiosk session.`,
            });
            const record = response?.data?.record;
            if (record) onSaved?.(record, safeConfig.title);
        } catch (error) {
            showToast?.({
                type: "error",
                title: "Unable to save",
                message: error?.response?.data?.message || "Please try again.",
            });
        } finally {
            setSaving(false);
        }
    };

    const primaryValue = useMemo(
        () => {
            const displayReading = step >= 3 && capturedReading ? capturedReading : reading;
            return safeConfig.format(displayReading.value, displayReading.secondaryValue);
        },
        [capturedReading, reading, safeConfig, step],
    );

    useEffect(() => {
        if (!config) return;
        const spokenKey = `${safeConfig.type}-${step}`;
        if (spokenStepRef.current === spokenKey) return;
        const stepGuidance = [
            `${safeConfig.title} instructions. ${safeConfig.instructions} Press Continue when you are ready.`,
            `${safeConfig.title} positioning. ${safeConfig.positioning} Press Continue to start reading.`,
            `${safeConfig.title} reading started. Please stay still while the kiosk captures your measurement.`,
            `${safeConfig.title} result is ${primaryValue}. Review the reading, then press Continue to save it.`,
            `Save ${safeConfig.title}. Press Confirm and Save to store this reading for your health results.`,
        ];
        spokenStepRef.current = spokenKey;
        speak(stepGuidance[step]);
    }, [config, primaryValue, safeConfig.instructions, safeConfig.positioning, safeConfig.title, speak, step]);

    useEffect(() => {
        if (!assistantEnabled || step !== 2 || !reading.error) return;

        const spokenKey = `${safeConfig.type}-${readingAttempt}-${reading.error}`;
        if (spokenReadingErrorRef.current === spokenKey) return;

        spokenReadingErrorRef.current = spokenKey;
        speak(`${reading.error} Press Try again to retake the measurement, or press Dashboard to leave this health check.`);
    }, [assistantEnabled, reading.error, readingAttempt, safeConfig.type, speak, step]);

    if (!config) return null;

    const currentStep = stepCopy[step];
    const progressPercent = ((step + 1) / flowSteps.length) * 100;
    const sendStop = () => {
        measurementService.command("STOP").catch(() => {});
    };
    const allowStepBack = step < 3;
    const exitToPicker = () => {
        if (step === 2) sendStop();
        onBack?.();
    };
    const goBack = () => {
        if (step === 2) sendStop();
        if (step === 0) {
            onBack?.();
            return;
        }
        setStep((s) => Math.max(0, s - 1));
    };
    const goDashboard = () => {
        if (step === 2) sendStop();
        (onDashboard || onBack)?.();
    };

    return (
        <motion.section
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden rounded-3xl border"
            style={{
                backgroundColor: "var(--color-card)",
                borderColor: "var(--color-border)",
                boxShadow: "0 1px 3px color-mix(in srgb, var(--color-text) 6%, transparent), 0 8px 40px color-mix(in srgb, var(--color-primary) 8%, transparent)",
            }}
        >
            {/* ── Top progress bar ── */}
            <div
                className="h-1 transition-all duration-500"
                style={{
                    width: `${progressPercent}%`,
                    background: "linear-gradient(90deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 60%, var(--color-success)))",
                }}
            />

            {/* ── Header ── */}
            <div
                className="border-b px-5 py-3 md:px-6"
                style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "var(--color-surface)",
                }}
            >
                <div className="flex flex-col gap-3">
                    {/* Top row: back + title */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <button
                            type="button"
                            onClick={exitToPicker}
                            disabled={lockReadingFocus}
                            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black transition hk-soft-hover"
                            style={{
                                backgroundColor: "var(--color-card)",
                                borderColor: "var(--color-border)",
                                color: "var(--color-text)",
                                opacity: lockReadingFocus ? 0.35 : 1,
                                pointerEvents: lockReadingFocus ? "none" : "auto",
                            }}
                        >
                            <ArrowLeft size={15} />
                            Back to Health Checks
                        </button>

                        <div className="flex items-center gap-3">
                            <div
                                className="flex h-8 w-8 items-center justify-center rounded-xl"
                                style={{
                                    backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, var(--color-card))",
                                    color: "var(--color-primary)",
                                }}
                            >
                                <Icon size={18} />
                            </div>
                            <div>
                                <p
                                    className="text-[10px] font-black uppercase tracking-[0.18em]"
                                    style={{ color: "var(--color-primary)" }}
                                >
                                    Guided health check
                                </p>
                                <h2
                                    className="text-base font-black leading-none"
                                    style={{ letterSpacing: "-0.02em" }}
                                >
                                    {safeConfig.title}
                                </h2>
                            </div>
                        </div>
                    </div>

                    {/* Step rail */}
                    <div
                        className={`rounded-2xl border p-2 transition-all duration-300 ${lockReadingFocus ? "pointer-events-none blur-[2px]" : ""}`}
                        style={{
                            backgroundColor: "var(--color-card)",
                            borderColor: "var(--color-border)",
                            opacity: lockReadingFocus ? 0.35 : 1,
                        }}
                    >
                        <div className="grid gap-2 md:grid-cols-5">
                            {flowSteps.map((label, index) => {
                                const complete = index < step;
                                const active = index === step;
                                return (
                                    <div
                                        key={label}
                                    className={`flex items-center gap-2 rounded-xl px-2.5 py-2 transition-all duration-300 ${assistantEnabled && active ? "hk-step-assist-hint" : ""}`}
                                        style={{
                                            backgroundColor: active
                                                ? "color-mix(in srgb, var(--color-primary) 10%, var(--color-surface))"
                                                : complete
                                                ? "color-mix(in srgb, var(--color-success) 7%, transparent)"
                                                : "transparent",
                                            border: "1px solid",
                                            borderColor: active
                                                ? "color-mix(in srgb, var(--color-primary) 28%, var(--color-border))"
                                                : complete
                                                ? "color-mix(in srgb, var(--color-success) 22%, transparent)"
                                                : "transparent",
                                        }}
                                    >
                                        <span
                                            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-[10px] font-black transition-all duration-300"
                                            style={{
                                                backgroundColor: complete
                                                    ? "var(--color-success)"
                                                    : active
                                                    ? "var(--color-primary)"
                                                    : "var(--color-surface)",
                                                color: complete || active ? "#fff" : "var(--color-muted)",
                                            }}
                                        >
                                            {complete ? <Check size={12} strokeWidth={3} /> : index + 1}
                                        </span>
                                        <span className="min-w-0">
                                            <span
                                                className="block truncate text-[11px] font-black tracking-wide"
                                                style={{ color: active ? "var(--color-text)" : "var(--color-muted)" }}
                                            >
                                                {label}
                                            </span>
                                            <span
                                                className="hidden text-[10px] font-semibold md:block"
                                                style={{ color: "var(--color-muted)", opacity: 0.6 }}
                                            >
                                                Step {index + 1}
                                            </span>
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Main body ── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -14 }}
                    transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 0.26, ease: "easeOut" }}
                    className="grid lg:grid-cols-[16.5rem_1fr]"
                >
                    {/* ── Sidebar ── */}
                    <aside
                        className={`border-b p-4 transition-all duration-300 lg:border-b-0 lg:border-r ${lockReadingFocus ? "pointer-events-none blur-[2px]" : ""}`}
                        style={{
                            borderColor: "var(--color-border)",
                            backgroundColor: "var(--color-surface)",
                            opacity: lockReadingFocus ? 0.35 : 1,
                        }}
                    >
                        {/* Identity card */}
                        <div
                            className="overflow-hidden rounded-xl border"
                            style={{
                                backgroundColor: "var(--color-card)",
                                borderColor: "var(--color-border)",
                            }}
                        >
                            {/* Card top accent */}
                            <div
                                className="h-0.5"
                                style={{
                                    background: "linear-gradient(90deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 40%, transparent))",
                                    width: `${progressPercent}%`,
                                    transition: "width 0.5s cubic-bezier(0.16,1,0.3,1)",
                                }}
                            />
                            <div className="p-4">
                                <div className="flex items-start gap-4">
                                    <div
                                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white"
                                        style={{ backgroundColor: "var(--color-primary)" }}
                                    >
                                        <Icon size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <p
                                            className="text-[10px] font-black uppercase tracking-[0.14em]"
                                            style={{ color: "var(--color-muted)" }}
                                        >
                                            Step {step + 1} of 5
                                        </p>
                                        <h3
                                            className="mt-0.5 text-sm font-black leading-snug"
                                            style={{ letterSpacing: "-0.02em" }}
                                        >
                                            {safeConfig.title}
                                        </h3>
                                    </div>
                                </div>
                                <p
                                    className="mt-2 text-xs leading-5"
                                    style={{ color: "var(--color-muted)" }}
                                >
                                    {safeConfig.description}
                                </p>
                            </div>
                        </div>

                        {/* Info rows */}
                        <div className="mt-3 space-y-2">
                            <InfoRow label="Device to use" value={safeConfig.sensor} icon={Gauge} />
                            <InfoRow label="Current stage" value={flowSteps[step]} icon={CircleDot} />
                        </div>
                    </aside>

                    {/* ── Stage panel ── */}
                    <article className="p-4 md:p-5">
                        <div
                            className="min-h-[300px] overflow-hidden rounded-2xl border"
                            style={{
                                backgroundColor: "var(--color-card)",
                                borderColor: "var(--color-border)",
                            }}
                        >
                            {/* Stage inner top accent */}
                            <div
                                className="h-px"
                                style={{
                                    background: "linear-gradient(90deg, color-mix(in srgb, var(--color-primary) 30%, transparent), transparent)",
                                }}
                            />

                            <div className="p-5 md:p-6">
                                {step === 0 && (
                                    <Panel
                                        eyebrow={currentStep.eyebrow}
                                        title={currentStep.title}
                                        body={safeConfig.instructions}
                                        helper={currentStep.helper}
                                        icon={Icon}
                                        type={safeConfig.type}
                                        visual={currentStep.visual}
                                    />
                                )}
                                {step === 1 && (
                                    <Panel
                                        eyebrow={currentStep.eyebrow}
                                        title={currentStep.title}
                                        body={safeConfig.positioning}
                                        helper={currentStep.helper}
                                        icon={Hand}
                                        type={safeConfig.type}
                                        visual={currentStep.visual}
                                    />
                                )}
                                {step === 2 && (
                                    <ReadingPanel
                                        currentStep={currentStep}
                                        reading={reading}
                                        primaryValue={primaryValue}
                                        icon={Icon}
                                        positioning={safeConfig.positioning}
                                        type={safeConfig.type}
                                    />
                                )}
                                {step === 3 && (
                                    <ResultPanel
                                        currentStep={currentStep}
                                        primaryValue={primaryValue}
                                        type={safeConfig.type}
                                    />
                                )}
                                {step === 4 && (
                                    <Panel
                                        eyebrow={currentStep.eyebrow}
                                        title={currentStep.title}
                                        body="This final reading will be saved to your health result for this kiosk visit."
                                        helper={currentStep.helper}
                                        icon={Save}
                                        type={safeConfig.type}
                                        visual={currentStep.visual}
                                    />
                                )}
                            </div>
                        </div>

                        {/* ── Action bar ── */}
                        <div
                            className={`mt-3 flex gap-3 rounded-2xl border p-2.5 transition-all duration-300 ${lockReadingFocus ? "pointer-events-none blur-[2px]" : ""}`}
                            style={{
                                backgroundColor: "var(--color-surface)",
                                borderColor: "var(--color-border)",
                                opacity: lockReadingFocus ? 0.35 : 1,
                            }}
                        >
                            {allowStepBack ? (
                                <button
                                    type="button"
                                    onClick={goBack}
                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-black transition hk-soft-hover"
                                    style={{
                                        backgroundColor: "var(--color-card)",
                                        borderColor: "var(--color-border)",
                                        color: "var(--color-text)",
                                    }}
                                >
                                    <RotateCcw size={15} />
                                    Back
                                </button>
                            ) : null}

                            {step === 2 && reading.error ? (
                                <div className="grid flex-1 grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            measurementService.resetLiveVitals().catch(() => {});
                                            setReadingAttempt((attempt) => attempt + 1);
                                        }}
                                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black text-white transition hk-primary-hover ${assistantEnabled ? "hk-flow-action-hint" : ""}`}
                                        style={{ backgroundColor: "var(--color-primary)" }}
                                    >
                                        <RotateCcw size={15} />
                                        Try again
                                    </button>
                                    <button
                                        type="button"
                                        onClick={goDashboard}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-black transition hk-soft-hover"
                                        style={{
                                            backgroundColor: "var(--color-card)",
                                            borderColor: "var(--color-border)",
                                            color: "var(--color-text)",
                                        }}
                                    >
                                        <ArrowLeft size={15} />
                                        Dashboard
                                    </button>
                                </div>
                            ) : step === 2 ? (
                                <div
                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition-all duration-300"
                                    style={{
                                        backgroundColor: reading.stabilized
                                            ? "color-mix(in srgb, var(--color-success) 10%, var(--color-surface))"
                                            : "var(--color-surface)",
                                        color: reading.stabilized
                                            ? "var(--color-success)"
                                            : "var(--color-muted)",
                                        border: "1px solid",
                                        borderColor: reading.stabilized
                                            ? "color-mix(in srgb, var(--color-success) 25%, transparent)"
                                            : "var(--color-border)",
                                    }}
                                >
                                    {reading.stabilized ? <CheckCircle2 size={15} /> : <Gauge size={15} />}
                                    {reading.stabilized ? "Final value detected. Opening result..." : "Reading in progress. Please wait..."}
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() =>
                                        step === 4
                                            ? save()
                                            : setStep((s) => Math.min(flowSteps.length - 1, s + 1))
                                    }
                                    className={`group inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black text-white transition-all duration-300 hk-primary-hover disabled:cursor-not-allowed disabled:opacity-70 ${assistantEnabled ? "hk-flow-action-hint" : ""}`}
                                    style={{
                                        backgroundColor: "var(--color-primary)",
                                        boxShadow: "0 4px 16px color-mix(in srgb, var(--color-primary) 28%, transparent)",
                                    }}
                                >
                                    {step === 4 ? (
                                        <>
                                            {saving ? "Saving…" : "Confirm & Save"}
                                            {!saving && <Save size={15} />}
                                        </>
                                    ) : (
                                        <>
                                            Continue
                                            <ArrowRight
                                                size={15}
                                                className="transition-transform duration-200 group-hover:translate-x-1"
                                            />
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </article>
                </motion.div>
            </AnimatePresence>
        </motion.section>
    );
}

/* ── Sub-components ──────────────────────────────────────────────── */

function InfoRow({ label, value, icon: RowIcon }) {
    return (
        <div
            className="flex items-start gap-3 rounded-xl border p-3"
            style={{
                backgroundColor: "var(--color-card)",
                borderColor: "var(--color-border)",
            }}
        >
            {RowIcon && (
                <div
                    className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{
                        backgroundColor: "var(--color-surface)",
                        color: "var(--color-primary)",
                    }}
                >
                    <RowIcon size={15} />
                </div>
            )}
            <div className="min-w-0">
                <p
                    className="text-[10px] font-black uppercase tracking-[0.14em]"
                    style={{ color: "var(--color-muted)" }}
                >
                    {label}
                </p>
                <p className="mt-0.5 text-xs font-bold leading-5">{value}</p>
            </div>
        </div>
    );
}

function useMeasurementReading(type, running, attempt) {
    const usesLiveSensor = Boolean(sensorStartCommands[type]);
    const simulatedReading = useMeasurementSimulation(type, running && !usesLiveSensor);
    const liveVitalsReading = useLiveVitalsReading(type, running && usesLiveSensor, attempt);

    if (usesLiveSensor) {
        return liveVitalsReading;
    }

    return { ...simulatedReading, source: "simulation", error: null };
}

function useLiveVitalsReading(type, running, attempt) {
    const [reading, setReading] = useState({
        value: null,
        secondaryValue: null,
        stabilized: false,
        source: "live",
        error: null,
        status: null,
        statusMessage: null,
        displayValue: null,
    });

    useEffect(() => {
        if (!running) {
            return undefined;
        }

        let alive = true;
        let sensorDetected = false;
        let pollTimer = null;
        let timeoutTimer = null;
        let controller = null;

        setReading({
            value: null,
            secondaryValue: null,
            stabilized: false,
            source: "live",
            error: null,
            status: null,
            statusMessage: null,
            displayValue: null,
        });

        const readVitals = async () => {
            controller?.abort();
            controller = new AbortController();

            try {
                const response = await fetch(`/api/kiosk/live-vitals?_=${Date.now()}`, {
                    signal: controller.signal,
                    cache: "no-store",
                    headers: {
                        Accept: "application/json",
                        "Cache-Control": "no-cache, no-store, must-revalidate",
                        Pragma: "no-cache",
                    },
                });

                if (!response.ok) {
                    throw new Error("Sensor feed unavailable.");
                }

                const data = await response.json();
                const heartRate = Number(data.heart_rate);
                const spo2 = Number(data.spo2);
                const weight = Number(data.weight);
                const hasHeartRate = Number.isFinite(heartRate) && heartRate > 0;
                const hasSpo2 = Number.isFinite(spo2) && spo2 > 0;
                const hasWeight = Number.isFinite(weight) && weight > 0;
                const isOximeter = type === "heart_rate";
                const hasAnyReading = isOximeter ? hasHeartRate || hasSpo2 : hasWeight;
                const status = typeof data.status === "string" ? data.status : null;
                const debugIr = Number(data.debug_ir);
                const hasFingerStatus = isOximeter && status?.includes("FINGER_DETECTED");
                const hasHighIr = isOximeter && Number.isFinite(debugIr) && debugIr >= 10000;
                const valid = isOximeter
                    ? hasHeartRate && hasSpo2 && data.ready === true
                    : hasWeight && data.ready === true;

                if (!alive) return;

                if (hasFingerStatus || hasHighIr) {
                    sensorDetected = true;
                }

                if (status && isOximeter && !hasAnyReading) {
                    setReading({
                        value: null,
                        secondaryValue: null,
                        stabilized: false,
                        source: "live",
                        error: null,
                        status,
                        statusMessage: oximeterStatusMessage(status),
                        displayValue: status.includes("FINGER_DETECTED") ? "Calculating..." : null,
                    });
                }

                if (hasAnyReading) {
                    sensorDetected = true;
                    setReading({
                        value: isOximeter ? (hasHeartRate ? heartRate : null) : weight,
                        secondaryValue: isOximeter && hasSpo2 ? spo2 : null,
                        stabilized: valid,
                        source: "live",
                        error: null,
                        status: valid ? "RESULT_READY" : status,
                        statusMessage: valid
                            ? "Measurement successful"
                            : isOximeter
                            ? "Live reading received. Waiting for the final stable result..."
                            : "Live weight received. Waiting for the final stable result...",
                        displayValue: null,
                    });

                    if (valid) {
                        return;
                    }
                }
            } catch (error) {
                if (error.name === "AbortError" || !alive) return;
            }

            if (alive) {
                pollTimer = window.setTimeout(readVitals, 500);
            }
        };

        timeoutTimer = window.setTimeout(() => {
            if (!alive || sensorDetected) return;

            alive = false;
            controller?.abort();
            if (pollTimer) window.clearTimeout(pollTimer);

            setReading({
                value: null,
                secondaryValue: null,
                stabilized: false,
                source: "live",
                error: type === "heart_rate"
                    ? "No heart rate or SpO2 sensor reading detected after 5 seconds. Please place your finger again and try."
                    : "No stable weight reading detected after 5 seconds. Please step onto the platform again and try.",
                status: null,
                statusMessage: null,
                displayValue: null,
            });
        }, LIVE_SENSOR_TIMEOUT_MS);

        readVitals();

        return () => {
            alive = false;
            controller?.abort();
            if (pollTimer) window.clearTimeout(pollTimer);
            if (timeoutTimer) window.clearTimeout(timeoutTimer);
        };
    }, [attempt, running, type]);

    return reading;
}

function oximeterStatusMessage(status) {
    if (status?.includes("PLACE_FINGER")) {
        return "Place your finger on the sensor.";
    }

    if (status?.includes("FINGER_DETECTED")) {
        return "Finger detected. Calculating BPM and SpO2...";
    }

    return "Reading live values. Waiting for stable final reading...";
}

function Panel({ eyebrow, title, body, helper, icon: PanelIcon, type, visual }) {
    return (
        <div className="grid min-h-[260px] items-start gap-6 lg:grid-cols-[1fr_13rem]">
            <div>
                <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{
                        backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, var(--color-surface))",
                        color: "var(--color-primary)",
                    }}
                >
                    <PanelIcon size={20} />
                </div>
                <p
                    className="mt-4 text-[10px] font-black uppercase tracking-[0.18em]"
                    style={{ color: "var(--color-primary)" }}
                >
                    {eyebrow}
                </p>
                <h3
                    className="mt-1.5 text-2xl font-black leading-tight"
                    style={{ letterSpacing: "-0.025em" }}
                >
                    {title}
                </h3>
                <p
                    className="mt-4 max-w-2xl rounded-2xl border px-5 py-4 text-base font-black leading-7 md:text-lg md:leading-8"
                    style={{
                        backgroundColor: "color-mix(in srgb, var(--color-primary) 8%, var(--color-card))",
                        borderColor: "color-mix(in srgb, var(--color-primary) 22%, var(--color-border))",
                        color: "var(--color-text)",
                    }}
                >
                    {body}
                </p>
                {helper && (
                    <div
                        className="mt-4 flex gap-3 rounded-xl border p-3"
                        style={{
                            backgroundColor: "var(--color-surface)",
                            borderColor: "var(--color-border)",
                        }}
                    >
                        <ShieldCheck
                            className="mt-0.5 flex-shrink-0"
                            size={16}
                            style={{ color: "var(--color-primary)" }}
                        />
                        <p className="text-xs font-semibold leading-5" style={{ color: "var(--color-muted)" }}>
                            {helper}
                        </p>
                    </div>
                )}
            </div>
            <StepIllustration type={type} visual={visual} />
        </div>
    );
}

function ReadingPanel({ currentStep, reading, primaryValue, icon: ReadIcon, positioning }) {
    return (
        <div className="min-h-[260px]">
            <div>
                <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{
                        backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, var(--color-surface))",
                        color: "var(--color-primary)",
                    }}
                >
                    <ReadIcon size={20} />
                </div>
                <p
                    className="mt-4 text-[10px] font-black uppercase tracking-[0.18em]"
                    style={{ color: "var(--color-primary)" }}
                >
                    {currentStep.eyebrow}
                </p>
                <h3
                    className="mt-1.5 text-2xl font-black leading-tight"
                    style={{ letterSpacing: "-0.025em" }}
                >
                    {currentStep.title}
                </h3>
                <p
                    className="mt-3 max-w-xl text-sm leading-6"
                    style={{ color: "var(--color-muted)" }}
                >
                    {reading.error
                        ? reading.error
                        : reading.stabilized
                        ? "Reading stabilized. Opening your result screen now."
                        : reading.statusMessage || positioning}
                </p>

                {/* Live value display */}
                <div
                    className="mt-4 overflow-hidden rounded-2xl border"
                    style={{
                        backgroundColor: "var(--color-surface)",
                        borderColor: reading.error
                            ? "color-mix(in srgb, var(--color-error) 35%, var(--color-border))"
                            : reading.stabilized
                            ? "color-mix(in srgb, var(--color-success) 35%, var(--color-border))"
                            : "var(--color-border)",
                        transition: "border-color 0.4s ease",
                    }}
                >
                    {/* Micro progress bar on value card */}
                    <div
                        className="h-0.5 transition-all duration-700"
                        style={{
                            backgroundColor: reading.error ? "var(--color-error)" : reading.stabilized ? "var(--color-success)" : "var(--color-primary)",
                            width: reading.error || reading.stabilized ? "100%" : "60%",
                        }}
                    />
                    <div className="p-4">
                        <p
                            className="text-[10px] font-black uppercase tracking-[0.16em]"
                            style={{ color: "var(--color-muted)" }}
                        >
                            Live value
                        </p>
                        <div
                            className="mt-2 font-black tracking-tight transition-all duration-300"
                            style={{
                                fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
                                letterSpacing: "-0.04em",
                                color: reading.error ? "var(--color-error)" : reading.stabilized ? "var(--color-success)" : "var(--color-text)",
                            }}
                        >
                            {reading.displayValue || primaryValue}
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <div
                                className="h-2 w-2 rounded-full"
                                style={{
                                    backgroundColor: reading.error
                                        ? "var(--color-error)"
                                        : reading.stabilized
                                        ? "var(--color-success)"
                                        : "var(--color-primary)",
                                    animation: reading.error || reading.stabilized ? "none" : "pulse 1s infinite",
                                }}
                            />
                            <p
                                className="text-xs font-bold"
                                style={{
                                    color: reading.error ? "var(--color-error)" : reading.stabilized ? "var(--color-success)" : "var(--color-muted)",
                                }}
                            >
                                {reading.error
                                    ? "Sensor not detected"
                                    : reading.stabilized
                                    ? "Measurement successful"
                                    : reading.statusMessage || "Reading live values. Waiting for stable final reading..."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ResultPanel({ currentStep, primaryValue, type }) {
    return (
        <div className="grid min-h-[260px] items-start gap-6 lg:grid-cols-[1fr_13rem]">
            <div>
                <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{
                        backgroundColor: "color-mix(in srgb, var(--color-success) 10%, var(--color-surface))",
                        color: "var(--color-success)",
                    }}
                >
                    <CheckCircle2 size={20} />
                </div>
                <p
                    className="mt-4 text-[10px] font-black uppercase tracking-[0.18em]"
                    style={{ color: "var(--color-success)" }}
                >
                    {currentStep.eyebrow}
                </p>
                <h3
                    className="mt-1.5 text-2xl font-black leading-tight"
                    style={{ letterSpacing: "-0.025em" }}
                >
                    {currentStep.title}
                </h3>
                <p
                    className="mt-3 max-w-xl text-sm leading-6"
                    style={{ color: "var(--color-muted)" }}
                >
                    If this looks wrong, go back and retake before saving.
                </p>

                {/* Result display */}
                <div
                    className="mt-4 overflow-hidden rounded-2xl border"
                    style={{
                        backgroundColor: "var(--color-surface)",
                        borderColor: "color-mix(in srgb, var(--color-success) 35%, var(--color-border))",
                    }}
                >
                    <div
                        className="h-0.5"
                        style={{
                            backgroundColor: "var(--color-success)",
                            width: "100%",
                        }}
                    />
                    <div className="p-4">
                        <p
                            className="text-[10px] font-black uppercase tracking-[0.16em]"
                            style={{ color: "var(--color-muted)" }}
                        >
                            Captured result
                        </p>
                        <div
                            className="mt-2 font-black tracking-tight"
                            style={{
                                fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
                                letterSpacing: "-0.04em",
                                color: "var(--color-success)",
                            }}
                        >
                            {primaryValue}
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <Check
                                size={13}
                                style={{ color: "var(--color-success)" }}
                                strokeWidth={3}
                            />
                            <p className="text-xs font-bold" style={{ color: "var(--color-success)" }}>
                                Ready to save
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <MeasurementSuccessVisual type={type} />
        </div>
    );
}

function StepIllustration({ type, visual }) {
    return (
        <div
            className="mx-auto w-full max-w-[13rem] overflow-hidden rounded-2xl border"
            style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
            }}
            aria-hidden="true"
        >
            {/* Thin top accent */}
            <div
                className="h-0.5"
                style={{
                    background: "linear-gradient(90deg, var(--color-primary), transparent)",
                }}
            />
            <div className="p-3">
                <MeasurementIllustration type={type} visual={visual} />
                <div className="mt-4 flex gap-1.5">
                    {["Ready", "Steady", "Saved"].map((label, index) => (
                        <div
                            key={label}
                            className="flex-1 rounded-lg py-1.5 text-center text-[9px] font-black uppercase tracking-wide"
                            style={{
                                backgroundColor:
                                    index === 1
                                        ? "color-mix(in srgb, var(--color-primary) 10%, var(--color-card))"
                                        : "var(--color-card)",
                                color:
                                    index === 1 ? "var(--color-primary)" : "var(--color-muted)",
                                border: "1px solid var(--color-border)",
                            }}
                        >
                            {label}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function MeasurementSuccessVisual({ type }) {
    return (
        <div
            className="mx-auto flex w-full max-w-[15rem] flex-col items-center justify-center overflow-hidden rounded-2xl border py-8"
            style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "color-mix(in srgb, var(--color-success) 30%, var(--color-border))",
            }}
            aria-hidden="true"
        >
            <div
                className="measurement-success-mark flex h-24 w-24 items-center justify-center rounded-full"
                style={{
                    backgroundColor: "color-mix(in srgb, var(--color-success) 10%, var(--color-card))",
                    color: "var(--color-success)",
                    border: "2px solid color-mix(in srgb, var(--color-success) 25%, transparent)",
                }}
            >
                <CheckCircle2 size={44} />
            </div>
            <div className="mt-5 w-full px-4">
                <MeasurementIllustration type={type} compact />
            </div>
            <p
                className="mt-4 text-[10px] font-black uppercase tracking-[0.18em]"
                style={{ color: "var(--color-success)" }}
            >
                Ready to save
            </p>
        </div>
    );
}

function MeasurementIllustration({ type, visual, compact = false }) {
    const accent = "var(--color-primary)";
    const sensorLabel = {
        heart_rate: "SpO2",
        temperature: "TEMP",
        height: "CM",
        weight: "KG",
    }[type] || "SENSOR";

    return (
        <div className={compact ? "w-full max-w-[8rem] mx-auto" : "mx-auto w-full"} aria-hidden="true">
            <svg
                viewBox="0 0 240 280"
                className={`h-auto w-full ${visual === "position" ? "measurement-visual-bob" : ""}`}
                role="img"
            >
                <defs>
                    <linearGradient
                        id={`kioskGradient-${type}`}
                        x1="44" x2="196" y1="28" y2="250"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop stopColor="var(--color-card)" />
                        <stop offset="1" stopColor="color-mix(in srgb, var(--color-primary) 10%, var(--color-card))" />
                    </linearGradient>
                </defs>
                <rect x="32" y="18" width="176" height="244" rx="34" fill={`url(#kioskGradient-${type})`} stroke="var(--color-border)" />
                <rect x="54" y="38" width="132" height="82" rx="22" fill="var(--color-card)" stroke="var(--color-border)" />
                <circle cx="120" cy="77" r="24" fill="color-mix(in srgb, var(--color-primary) 16%, var(--color-card))" />
                <path d="M98 151c5-31 39-38 54-14 7 11 9 27 11 49H82c2-17 6-28 16-35z" fill="color-mix(in srgb, var(--color-primary) 13%, var(--color-card))" stroke="var(--color-border)" />
                <path d="M84 166c-18 15-23 33-17 54" fill="none" stroke={accent} strokeWidth="8" strokeLinecap="round" />
                <path d="M156 166c18 15 23 33 17 54" fill="none" stroke={accent} strokeWidth="8" strokeLinecap="round" />
                <rect x="72" y="218" width="96" height="26" rx="13" fill={accent} opacity="0.95" />
                <text x="120" y="235" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="900" letterSpacing="1">
                    {sensorLabel}
                </text>

                {type === "height" && (
                    <>
                        <path d="M195 48v178" stroke={accent} strokeWidth="6" strokeLinecap="round" />
                        <path d="M183 48h24M183 226h24" stroke={accent} strokeWidth="6" strokeLinecap="round" />
                        <path d="M120 126v86" stroke="var(--color-muted)" strokeWidth="5" strokeLinecap="round" opacity="0.3" />
                    </>
                )}
                {type === "temperature" && (
                    <>
                        <path d="M174 72c23 9 24 40 0 52" fill="none" stroke={accent} strokeWidth="7" strokeLinecap="round" />
                        <circle cx="178" cy="96" r="8" fill="var(--color-error, #ef4444)" opacity="0.7" />
                    </>
                )}
                {type === "heart_rate" && (
                    <>
                        <path d="M76 91h20l10-17 19 36 12-20h25" fill="none" stroke={accent} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
                        <rect x="145" y="190" width="48" height="40" rx="15" fill="var(--color-card)" stroke={accent} strokeWidth="5" />
                        <path d="M139 210h-26c-11 0-19-8-19-19v-13" fill="none" stroke="var(--color-muted)" strokeWidth="7" strokeLinecap="round" opacity="0.45" />
                        <path d="M153 211h31" stroke={accent} strokeWidth="7" strokeLinecap="round" />
                    </>
                )}
                {type === "weight" && (
                    <>
                        <rect x="58" y="248" width="124" height="14" rx="7" fill="var(--color-success)" opacity="0.85" />
                        <path d="M90 255c5-10 52-10 58 0" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
                    </>
                )}
            </svg>
        </div>
    );
}
