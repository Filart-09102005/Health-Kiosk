import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowLeft, CheckCircle2,
    Hand, Save, Timer, Loader2, AlertTriangle, Activity, Radio, Sparkles, PencilLine
} from "lucide-react";
import { measurementService } from "../services/measurementService";
import { useAssistant } from "../../AI-Assistant/context/AssistantProvider";
import { ASSISTANT_PROMPTS } from "../../AI-Assistant/constants/assistantPrompts";
import { useMeasurementWorkflow } from "../hooks/useMeasurementWorkflow";
import { MEASUREMENT_MODES } from "../hooks/useMeasurementMode";
import { rangesFor } from "../constants/measurementRanges";
import MeasurementValueForm from "./MeasurementValueForm";
import InstructionAnimation from "./InstructionAnimation";
import MeasurementProgressPanel from "./MeasurementProgressPanel";
import MeasurementNotDetectedModal from "./MeasurementNotDetectedModal";
import { useMeasurementProgress } from "../hooks/useMeasurementProgress";
import { useToast } from "../../../../Global/Toast";

const sensorStartCommands = {
    heart_rate: "START_HEART",
    weight: "START_WEIGHT",
    height: "START_HEIGHT",
    temperature: "START_TEMPERATURE",
};

// Default total duration of the "Reading" progress animation. Fast ramp to
// FAST_TARGET%, then a slow crawl to 100% — a deliberate loading "trick" that
// is NOT tied to real sensor state. When it hits 100%, whatever was captured
// at first valid detection is revealed as the final result.
const DEFAULT_READING_DURATION_MS = 7000;
const FAST_PHASE_RATIO = 0.25; // first 25% of the duration is the fast ramp
const FAST_TARGET = 80;
// How long the shared "Measurement Saved" step stays up before handing back to
// the dashboard — long enough to read, short enough not to feel like a wait.
const SAVED_HOLD_MS = 1600;

function formatMetricValue(raw, decimals = 0) {
    const num = Number(raw);
    if (!Number.isFinite(num) || num <= 0) return "--";
    return decimals > 0 ? num.toFixed(decimals) : String(Math.round(num));
}

function MetricTile({ label, value, unit, Icon, accent, live, pulse, compact }) {
    const isPlaceholder = value === "--";

    return (
        <div
            className="relative flex-1 rounded-3xl border overflow-hidden"
            style={{
                backgroundColor: "var(--color-surface)",
                borderColor: isPlaceholder ? "var(--color-border)" : `color-mix(in srgb, ${accent} 30%, var(--color-border))`,
                padding: compact ? "clamp(0.9rem, 3vw, 1.5rem)" : "clamp(1.1rem, 4vw, 2.25rem) clamp(0.9rem, 3vw, 1.5rem)",
            }}
        >
            {live && (
                <span
                    className="absolute top-4 right-4 flex items-center gap-1.5 text-[0.62rem] font-black uppercase tracking-wider"
                    style={{ color: accent }}
                >
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: accent }} />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: accent }} />
                    </span>
                    Live
                </span>
            )}

            <div className="flex items-center justify-center gap-2 mb-2 sm:mb-3">
                {Icon && (
                    <Icon
                        className={`${compact ? "w-3.5 h-3.5 sm:w-4 sm:h-4" : "w-4 h-4 sm:w-5 sm:h-5"} ${pulse && !isPlaceholder ? "animate-pulse" : ""}`}
                        style={{ color: accent }}
                    />
                )}
                <span className="text-[0.65rem] sm:text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--color-muted)" }}>
                    {label}
                </span>
            </div>

            <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                    key={value}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className={`font-black tabular-nums tracking-tighter ${compact ? "text-2xl sm:text-3xl md:text-4xl" : "text-3xl sm:text-5xl md:text-6xl"}`}
                    style={{ color: isPlaceholder ? "var(--color-muted)" : "var(--color-text)" }}
                >
                    {value}
                    <span
                        className={`font-medium ml-2 tracking-normal ${compact ? "text-xs sm:text-sm md:text-base" : "text-sm sm:text-lg md:text-xl"}`}
                        style={{ color: "var(--color-muted)" }}
                    >
                        {unit}
                    </span>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function LiveMetricGrid({ metrics, source, accent, live, compact }) {
    const single = metrics.length === 1;
    return (
        <div className={`grid gap-4 mx-auto ${single ? "max-w-sm grid-cols-1" : "max-w-2xl grid-cols-2"}`}>
            {metrics.map((m) => (
                <MetricTile
                    key={m.key}
                    label={m.label}
                    unit={m.unit}
                    value={formatMetricValue(source?.[m.key], m.decimals)}
                    Icon={m.icon}
                    accent={accent}
                    pulse={m.pulse}
                    live={live}
                    compact={compact}
                />
            ))}
        </div>
    );
}

// Identical five steps in both modes — only step 3's wording (and its content)
// reflects where the numbers come from.
const stepsFor = (isManual) => [
    { id: 1, label: "Instructions" },
    { id: 2, label: "Positioning" },
    { id: 3, label: isManual ? "Manual Entry" : "Reading" },
    { id: 4, label: "Result" },
    { id: 5, label: "Save" },
];

export default function MeasurementFlowShell({ config, mode = MEASUREMENT_MODES.SMART, onBack, onDashboard, onSaved }) {
    const { showToast } = useToast();
    const { enabled: assistantEnabled, speak } = useAssistant();
    const [workflowState, setWorkflowState] = useState("INTRO");
    const [saving, setSaving] = useState(false);
    const [sessionId, setSessionId] = useState(null);

    // Manual Mode swaps out the acquisition half of the flow: the sensor is
    // never started or polled, and Step 3 collects typed values instead.
    // Everything else — steps, layout, result, save — is shared.
    const isManual = mode === MEASUREMENT_MODES.MANUAL;
    // Kept across the Result → Edit round trip so the user never retypes.
    const [manualValues, setManualValues] = useState({});
    const [manualResult, setManualResult] = useState(null);
    const [savedRecord, setSavedRecord] = useState(null);
    // Bumped by "Try Again" so a fresh acquisition can start without bouncing
    // the person back through the Positioning step.
    const [attempt, setAttempt] = useState(0);

    // Fake-but-deliberate loading pacer for the Reading step, decoupled from
    // real sensor state — fast ramp to FAST_TARGET%, then a slow crawl to 100%.
    const [fakeProgress, setFakeProgress] = useState(0);
    // The first physiologically-plausible reading we saw this attempt — this
    // becomes the final result the moment the progress bar finishes, instead
    // of waiting for the sensor's own multi-second validate/collect pipeline.
    const [capturedResult, setCapturedResult] = useState(null);
    // Set once the progress bar completes: either the captured result, or a
    // "nothing detected in time" failure if nothing valid ever arrived.
    const [forcedOutcome, setForcedOutcome] = useState(null);

    const isMeasuring = workflowState === "MEASURING";
    // Passing isRunning=false in Manual keeps the live-vitals poller parked and
    // stops the hook's unmount cleanup from firing a STOP at hardware that was
    // never started.
    const { machineState, liveData, finalResult, error } = useMeasurementWorkflow(config?.type, isMeasuring && !isManual, sessionId);

    // Heart Rate & SpO2 opts out of the fake instant-capture trick — a valid
    // reading needs real multi-second signal collection, so its progress and
    // completion must come from the real backend machine_state, not a timer.
    const useInstantCapture = config?.instantCapture !== false;

    useEffect(() => {
        if (isManual) return;

        if (workflowState === "MEASURING") {
            const startCmd = sensorStartCommands[config?.type];
            if (startCmd) {
                measurementService.resetLiveVitals()
                    .then(() => measurementService.command(startCmd))
                    .then((res) => setSessionId(res.data.id))
                    .catch(() => showToast?.({ type: "error", title: "Command failed" }));
            }
        }
    }, [workflowState, config?.type, isManual, attempt]);

    // Reset per-attempt local state whenever a fresh Reading step starts.
    useEffect(() => {
        if (isManual) return;

        if (workflowState === "MEASURING") {
            setFakeProgress(0);
            setCapturedResult(null);
            setForcedOutcome(null);
            captureStartRef.current = null;
        }
    }, [workflowState, isManual, attempt]);

    const hasLiveData = liveData && liveData.primary != null;

    // "The sensor can currently see the person." Driven only by the firmware's
    // own machine state, not by whether a live number happens to be non-zero —
    // a sensor sitting in WAITING can still stream small baseline noise (e.g.
    // height reading ~1-2cm with nobody under it), and that must never be
    // mistaken for a real detection or the progress bar races ahead of the
    // hardware and stalls near 100% while the backend is honestly still
    // waiting. Everything that paces the Reading step hangs off this, so
    // nothing advances while the kiosk is staring at an empty scale.
    const detected = !isManual && ["VALIDATING", "READY", "COUNTDOWN", "COLLECTING", "PROCESSING", "COMPLETE"].includes(machineState);

    // Timestamp of first detection. Held in a ref rather than state so a brief
    // loss of contact does not restart the acquisition window — the person gets
    // the same total reading time they would have had without the wobble.
    const captureStartRef = useRef(null);

    useEffect(() => {
        if (workflowState !== "MEASURING") {
            captureStartRef.current = null;
            return;
        }
        if (detected && captureStartRef.current === null) {
            captureStartRef.current = performance.now();
        }
    }, [workflowState, detected]);

    // Acquisition pacer. This is NOT the progress bar — it is the clock that
    // decides how long we keep collecting before accepting the captured value.
    // It now starts on detection rather than on entering the step, so someone
    // still climbing onto the scale no longer burns their reading window.
    useEffect(() => {
        if (isManual) return;
        if (!useInstantCapture) return;
        if (workflowState !== "MEASURING") return;
        if (!detected) return;

        const durationMs = config?.readingDurationMs || DEFAULT_READING_DURATION_MS;
        const fastMs = durationMs * FAST_PHASE_RATIO;
        const start = captureStartRef.current ?? performance.now();
        let raf;

        const tick = (now) => {
            const elapsed = now - start;
            let pct;
            if (elapsed <= fastMs) {
                const t = Math.min(elapsed / fastMs, 1);
                pct = FAST_TARGET * (1 - Math.pow(1 - t, 2)); // ease-out
            } else {
                const t = Math.min((elapsed - fastMs) / (durationMs - fastMs), 1);
                pct = FAST_TARGET + (100 - FAST_TARGET) * t; // slow linear crawl
            }
            setFakeProgress(pct);
            if (elapsed < durationMs) {
                raf = requestAnimationFrame(tick);
            }
        };

        raf = requestAnimationFrame(tick);
        return () => { if (raf) cancelAnimationFrame(raf); };
    }, [workflowState, config?.readingDurationMs, useInstantCapture, isManual, detected]);

    // Capture the very first live value shown on screen as the eventual
    // final result — whatever the user can already see is fair game, we
    // don't gate it behind the sensor's own multi-second validation pipeline.
    useEffect(() => {
        if (isManual) return;
        if (!useInstantCapture) return;
        if (workflowState !== "MEASURING") return;
        if (capturedResult) return;
        if (!hasLiveData) return;
        if (["FAILED", "ERROR"].includes(machineState)) return;
        if (!(Number(liveData.primary) > 0)) return; // only capture a value the UI would actually render as a number, not "--"
        setCapturedResult({ primary: liveData.primary, secondary: liveData.secondary });
    }, [workflowState, capturedResult, hasLiveData, liveData, machineState, useInstantCapture, isManual]);

    // When the fake progress bar finishes, stop the real measurement and
    // reveal whatever was captured — or a "nothing detected" failure.
    useEffect(() => {
        if (isManual) return;
        if (!useInstantCapture) return;
        if (workflowState !== "MEASURING") return;
        if (forcedOutcome) return;
        if (["FAILED", "ERROR", "COMPLETE"].includes(machineState)) return; // let a real outcome win if it beat the timer
        if (fakeProgress < 100) return;

        measurementService.command("STOP");
        if (capturedResult) {
            setForcedOutcome({ type: "result", result: capturedResult });
        } else {
            setForcedOutcome({
                type: "failed",
                message: "No reading was detected in time. Please make sure you're positioned correctly and try again.",
            });
        }
    }, [fakeProgress, workflowState, machineState, forcedOutcome, capturedResult, useInstantCapture, isManual]);

    // Effective state: whichever comes first between the real sensor outcome
    // and our own forced (progress-bar-driven) outcome.
    const effectiveMachineState = forcedOutcome?.type === "failed" ? "FAILED"
        : forcedOutcome?.type === "result" ? "COMPLETE"
        : machineState;
    // In Manual the typed values are the result; there is no sensor outcome to
    // race against, so they win outright.
    const effectiveFinalResult = isManual
        ? manualResult
        : (forcedOutcome?.type === "result" ? forcedOutcome.result : finalResult);
    const effectiveError = forcedOutcome?.type === "failed" ? forcedOutcome.message : error;

    // 100% means the reading is genuinely finalised — a settled result exists.
    // Anything short of that leaves the bar short of the end, however long the
    // acquisition pacer has been running.
    const readingSettled = effectiveMachineState === "COMPLETE" && Boolean(effectiveFinalResult);
    const readingFailed = effectiveMachineState === "FAILED";

    const progressView = useMeasurementProgress({
        type: config?.type,
        active: workflowState === "MEASURING" && !isManual,
        machineState,
        detected,
        settled: readingSettled,
        failed: readingFailed,
        attempt,
    });

    useEffect(() => {
        if (isManual) return; // Manual advances on form submit, not on sensor state.
        if (effectiveMachineState === "COMPLETE" && workflowState === "MEASURING") {
            setTimeout(() => setWorkflowState("RESULT"), 1500);
        }
    }, [effectiveMachineState, workflowState, isManual]);

    const handleSave = async () => {
        if (!effectiveFinalResult || saving) return;
        setSaving(true);
        try {
            const response = await measurementService.save({
                type: config.type,
                value: effectiveFinalResult.primary,
                secondary_value: effectiveFinalResult.secondary,
                unit: config.unit,
                input_source: isManual ? MEASUREMENT_MODES.MANUAL : MEASUREMENT_MODES.SMART,
                metadata: isManual ? { source: "external device" } : { sensor: config.sensor },
            });

            // Out-of-range sensor readings are saved rather than refused while
            // calibration is being refined, so surface them here instead.
            (response?.data?.warnings || []).forEach((warning) => {
                showToast?.({ type: "warning", title: "Unusual reading", message: warning });
            });

            setSavedRecord(response?.data?.record ?? null);
            setWorkflowState("SAVED");
        } catch (err) {
            showToast?.({ type: "error", title: "Save failed" });
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        // Sensor readings commit themselves after a beat. Typed values never
        // do — a person must confirm what they entered before it is stored.
        if (isManual) return;
        if (workflowState === "RESULT" && effectiveFinalResult) {
            const timer = setTimeout(() => { handleSave(); }, 3000);
            return () => clearTimeout(timer);
        }
    }, [workflowState, effectiveFinalResult, isManual]);

    // ── Voice guidance ──
    // One announcement per step, worded for the mode the user is actually in.
    // speak() is a no-op unless Assistant Mode is on, so no guard is needed.
    useEffect(() => {
        if (workflowState === "INTRO") {
            speak(isManual ? "manualIntro" : `Ready for your ${config.title}. ${config.instructions}`);
        } else if (workflowState === "POSITIONING") {
            speak(isManual ? "manualPositioning" : config.positioning);
        } else if (workflowState === "MEASURING" && isManual) {
            speak("manualEntry");
        } else if (workflowState === "SAVED") {
            speak("measurementSaved");
        }
    }, [workflowState, isManual, config.type]);

    // Read the result aloud once it is on screen, so the numbers are available
    // to someone who cannot comfortably read the display.
    useEffect(() => {
        if (workflowState !== "RESULT" || !effectiveFinalResult) return;

        const spoken = metrics
            .map((metric) => {
                const value = effectiveFinalResult[metric.key];
                if (value === undefined || value === null) return null;
                return `${metric.label} ${value} ${metric.unit}`;
            })
            .filter(Boolean)
            .join(", ");

        speak(isManual ? `You entered ${spoken}. ${ASSISTANT_PROMPTS.manualReview}` : `Your result: ${spoken}.`);
    }, [workflowState, effectiveFinalResult, isManual]);

    // Both modes end on the same explicit Saved step, then hand back.
    useEffect(() => {
        if (workflowState !== "SAVED") return undefined;

        const timer = setTimeout(() => {
            if (savedRecord) onSaved?.(savedRecord, config.title);
            else onBack?.();
        }, SAVED_HOLD_MS);

        return () => clearTimeout(timer);
    }, [workflowState, savedRecord]);

    const stopSensor = () => {
        if (!isManual) measurementService.command("STOP");
    };

    const handleRetry = () => {
        stopSensor();
        // Manual returns straight to the form with the previous entry intact,
        // so "Edit" corrects a typo rather than starting over.
        setWorkflowState(isManual ? "MEASURING" : "POSITIONING");
    };

    // "Try Again" from the not-detected dialog. Restarts acquisition in place
    // rather than sending the person back a step — they are already standing
    // in the right spot, they just need the sensor to look again.
    const handleRetryDetection = () => {
        stopSensor();
        progressView.acknowledgeNotDetected();
        setAttempt((current) => current + 1);
    };

    const handleCancelDetection = () => {
        progressView.acknowledgeNotDetected();
        handleRetry();
    };

    const handleBack = () => {
        stopSensor();
        onBack?.();
    };

    const handleDashboard = () => {
        stopSensor();
        onDashboard?.();
    };

    const handleManualSubmit = (parsed) => {
        setManualResult(parsed);
        setWorkflowState("RESULT");
    };

    /**
     * Rejected entry on "Review Values".
     *
     * The per-field messages are already on screen; the toast exists because on
     * a kiosk the button is at the bottom and a field error above it is easy to
     * miss — the tap can otherwise read as "nothing happened".
     */
    const handleManualInvalid = (messages = []) => {
        const missing = metrics.filter((metric) => {
            const value = manualValues?.[metric.key];
            return value === undefined || value === null || String(value).trim() === "";
        });

        const message = missing.length === metrics.length
            ? `Please enter ${metrics.map((metric) => metric.label).join(" and ")} before continuing.`
            : missing.length > 0
                ? `${missing.map((metric) => metric.label).join(" and ")} ${missing.length > 1 ? "are" : "is"} still empty.`
                // Filled in, but out of range — the field messages say which.
                : messages[0] || "Please check the values you entered.";

        showToast?.({ type: "warning", title: "Check your entry", message });
        speak(messages[0] || ASSISTANT_PROMPTS.manualInvalid);
    };

    if (!config) return null;

    const metrics = config.metrics || [{ key: "primary", label: config.title, unit: config.unit, decimals: 0, icon: config.icon }];

    const STEPS = stepsFor(isManual);

    let currentStep = 1;
    if (workflowState === "INTRO") currentStep = 1;
    else if (workflowState === "POSITIONING") currentStep = 2;
    else if (workflowState === "MEASURING") currentStep = 3;
    else if (workflowState === "RESULT") currentStep = saving ? 5 : 4;
    else if (workflowState === "SAVED") currentStep = 5;

    // Manual instructions come from config so a new measurement type needs no
    // workflow changes — only a new config block.
    const introCopy = (isManual && config.manualInstructions) || config.instructions;
    const positioningCopy = (isManual && config.manualPositioning) || config.positioning;

    // Stable identity so the entry form's validation memo actually memoises.
    const manualRanges = useMemo(
        () => rangesFor(MEASUREMENT_MODES.MANUAL, config.type),
        [config.type],
    );

    const accent = config.accent || "var(--color-primary)";
    const accentContent = config.accentContent || "var(--color-primary-content)";
    // Must switch to the live-reading view at the exact same boundary the
    // progress bar uses for "detected" (VALIDATING and beyond) — otherwise
    // the bar can show a real detection (or "lost" after one) while this
    // panel is still stuck showing the pre-detection "Getting Sensor Ready"
    // placeholder underneath it.
    const isLiveReading = hasLiveData && !["WAITING", "FAILED", "COMPLETE"].includes(effectiveMachineState);
    // Once a value has been captured, freeze the on-screen numbers on it —
    // the underlying result is already locked, so the display shouldn't keep
    // drifting away from what's about to be shown as final.
    const displayData = capturedResult || liveData;

    // ─── Shared inline style helpers (theme-aware) ───────────────────────────
    const cardStyle = {
        backgroundColor: "var(--color-card)",
        borderColor: "var(--color-border)",
        color: "var(--color-text)",
    };
    const surfaceStyle = {
        backgroundColor: "var(--color-surface)",
        borderColor: "var(--color-border)",
    };
    const mutedText = { color: "var(--color-muted)" };
    const textStyle = { color: "var(--color-text)" };
    const btnSecondary = {
        backgroundColor: "var(--color-surface)",
        color: "var(--color-text)",
        borderColor: "var(--color-border)",
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md p-2 sm:p-4 md:p-8 overflow-hidden transition-all duration-500"
            style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
            <motion.section
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
                // No min-height: it was forcing 640px, which on a laptop is
                // taller than the padded viewport and is what produced the
                // scrollbar. The panel now takes exactly the height available.
                className="flex flex-col w-full max-w-6xl h-full max-h-full rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border relative"
                style={{ ...cardStyle, borderColor: "var(--color-border)" }}
            >
                {/* Ambient Accent Glow */}
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-32 blur-3xl opacity-15 pointer-events-none transition-colors duration-1000"
                    style={{ backgroundColor: accent }}
                />

                {/* ─── Header ──────────────────────────────────────────────── */}
                <header
                    className="px-3 py-3 sm:px-6 sm:py-5 md:px-10 md:py-7 flex items-center justify-between z-10 border-b backdrop-blur-sm gap-2"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
                >
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3 md:gap-5">
                        <button
                            onClick={handleBack}
                            className="w-9 h-9 sm:w-11 sm:h-11 md:w-14 md:h-14 shrink-0 rounded-xl md:rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 border shadow-sm"
                            style={btnSecondary}
                        >
                            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" strokeWidth={2.5} />
                        </button>
                        <div className="min-w-0">
                            <h2 className="truncate text-base sm:text-xl md:text-3xl font-black flex items-center gap-2 md:gap-3 tracking-tight" style={textStyle}>
                                <div className="hidden sm:block shrink-0 p-1.5 md:p-2.5 rounded-xl" style={{ backgroundColor: `color-mix(in srgb, ${accent} 9%, transparent)` }}>
                                    <config.icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-7 md:h-7" style={{ color: accent }} />
                                </div>
                                {config.title}
                            </h2>
                        </div>
                    </div>
                    <button
                        onClick={handleDashboard}
                        className="shrink-0 px-2.5 py-2 sm:px-5 sm:py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl text-xs sm:text-sm md:text-base font-bold hover:scale-105 active:scale-95 transition-all duration-200 border shadow-sm"
                        style={btnSecondary}
                    >
                        Dashboard
                    </button>
                </header>

                {/* ─── Body ────────────────────────────────────────────────── */}
                <div className="flex-1 flex flex-row overflow-hidden">

                    {/* Left Panel: Step Tracker */}
                    <div
                        className="w-[92px] sm:w-[190px] md:w-[300px] shrink-0 border-r p-2.5 sm:p-6 md:p-10 flex flex-col justify-center relative z-10"
                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                    >
                        <div className="hidden sm:block text-[0.6rem] md:text-xs font-black uppercase tracking-[0.2em] mb-4 md:mb-10 pl-2" style={mutedText}>
                            Step {currentStep} of {STEPS.length}
                        </div>
                        <div className="flex flex-col gap-4 sm:gap-6 md:gap-10 relative mt-2 pl-0 sm:pl-2">
                            {/* Background line */}
                            <div
                                className="absolute left-[15px] sm:left-[19px] top-6 bottom-6 w-0.5 rounded-full transition-colors"
                                style={{ backgroundColor: "var(--color-border)" }}
                            />
                            {/* Active line fill */}
                            <motion.div
                                className="absolute left-[15px] sm:left-[19px] top-6 w-0.5 rounded-full"
                                style={{ backgroundColor: accent, boxShadow: `0 0 10px ${accent}` }}
                                initial={{ height: 0 }}
                                animate={{ height: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            />
                            {STEPS.map((step) => {
                                const isActive = step.id === currentStep;
                                const isCompleted = step.id < currentStep;
                                return (
                                    <div key={step.id} className="flex items-center gap-2 sm:gap-4 md:gap-6 relative z-10">
                                        <div className="relative flex shrink-0 items-center justify-center">
                                            <div
                                                className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-500 border ${isActive ? "scale-110 shadow-lg" : ""}`}
                                                style={
                                                    isActive || isCompleted
                                                        ? { backgroundColor: accent, color: accentContent, borderColor: accent, boxShadow: isActive ? `0 8px 20px -6px ${accent}` : "none" }
                                                        : { backgroundColor: "var(--color-card)", color: "var(--color-muted)", borderColor: "var(--color-border)" }
                                                }
                                            >
                                                {isCompleted ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : step.id}
                                            </div>
                                        </div>
                                        <div
                                            className="hidden sm:block min-w-0 truncate transition-all duration-500 font-semibold text-sm md:text-lg"
                                            style={
                                                isActive
                                                    ? { color: "var(--color-text)", fontWeight: 900, transform: "translateX(4px)" }
                                                    : isCompleted
                                                    ? { color: "var(--color-muted)", fontWeight: 700 }
                                                    // Was var(--color-border) — #262626 in dark mode,
                                                    // which made upcoming steps all but invisible.
                                                    // Secondary, but still legible.
                                                    : { color: "color-mix(in srgb, var(--color-muted) 75%, transparent)", fontWeight: 600 }
                                            }
                                        >
                                            {step.label}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Live sensor readout mirrored in the sidebar while measuring */}
                        {workflowState === "MEASURING" && isLiveReading && (
                            <div className="hidden sm:block mt-6 md:mt-12 pl-2 pt-4 md:pt-8 border-t" style={{ borderColor: "var(--color-border)" }}>
                                <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] mb-3 flex items-center gap-1.5" style={{ color: accent }}>
                                    <span className="relative flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: accent }} />
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: accent }} />
                                    </span>
                                    Live now
                                </p>
                                <div className="space-y-2">
                                    {metrics.map((m) => (
                                        <div key={m.key} className="flex items-baseline justify-between">
                                            <span className="text-xs font-bold" style={mutedText}>{m.label}</span>
                                            <span className="text-lg font-black tabular-nums" style={textStyle}>
                                                {formatMetricValue(displayData?.[m.key], m.decimals)}
                                                <span className="text-xs font-bold ml-1" style={mutedText}>{m.unit}</span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Content */}
                    {/* Centred and clipped rather than scrollable — the step
                        content is sized to fit, so a scrollbar here would mean
                        something is wrong rather than something is long. */}
                    <div
                        className="flex-1 flex flex-col justify-center min-h-0 p-3 sm:p-4 md:p-6 overflow-hidden"
                        style={{
                            // Gradient carrying the measurement's accent, so the
                            // surface belongs to this reading rather than being
                            // a neutral panel.
                            background: `linear-gradient(160deg, color-mix(in srgb, ${accent} 7%, var(--color-card)) 0%, var(--color-card) 45%, color-mix(in srgb, ${accent} 4%, var(--color-card)) 100%)`,
                        }}
                    >
                        <AnimatePresence mode="wait">

                            {/* ── INTRO ── */}
                            {workflowState === "INTRO" && (
                                <motion.div key="intro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-2xl mx-auto w-full text-center">
                                    <div className="p-1 sm:p-2">
                                        <InstructionAnimation type={config.type} accent={accent} />
                                        <h1 className="text-xl sm:text-2xl md:text-4xl font-bold mb-2 sm:mb-4" style={textStyle}>Ready for your {config.title}?</h1>
                                        <p className="text-sm sm:text-base md:text-xl mb-2 leading-relaxed" style={mutedText}>{introCopy}</p>
                                    </div>
                                    <button
                                        onClick={() => setWorkflowState("POSITIONING")}
                                        className="mt-5 sm:mt-7 md:mt-10 px-6 py-3 sm:px-9 sm:py-4 md:px-12 md:py-5 rounded-full text-sm sm:text-lg md:text-xl font-bold transition-all active:scale-95 shadow-xl hover:opacity-90"
                                        style={{ backgroundColor: accent, color: accentContent, boxShadow: `0 20px 25px -5px color-mix(in srgb, ${accent} 25%, transparent)` }}
                                    >
                                        Next
                                    </button>
                                </motion.div>
                            )}

                            {/* ── POSITIONING ── */}
                            {workflowState === "POSITIONING" && (
                                <motion.div key="positioning" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-2xl mx-auto w-full text-center">
                                    <div className="p-1 sm:p-2">
                                        <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 mx-auto rounded-full flex items-center justify-center mb-4 sm:mb-6 md:mb-8 relative"
                                            style={{ backgroundColor: "var(--color-surface)" }}>
                                            <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: accent }} />
                                            <config.icon className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16" style={{ color: accent }} />
                                        </div>
                                        <h1 className="text-lg sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-4" style={textStyle}>
                                            {isManual ? "Take the measurement" : "Get into position"}
                                        </h1>
                                        <p className="text-sm sm:text-base md:text-xl mb-2 max-w-md mx-auto leading-relaxed" style={mutedText}>{positioningCopy}</p>
                                    </div>
                                    <button
                                        onClick={() => setWorkflowState("MEASURING")}
                                        className="mt-5 sm:mt-7 md:mt-10 px-6 py-3 sm:px-9 sm:py-4 md:px-12 md:py-5 rounded-full text-sm sm:text-lg md:text-xl font-bold transition-all active:scale-95 shadow-xl hover:opacity-90"
                                        style={{ backgroundColor: accent, color: accentContent, boxShadow: `0 20px 25px -5px color-mix(in srgb, ${accent} 25%, transparent)` }}
                                    >
                                        {isManual ? "Enter Values" : "Start Measurement"}
                                    </button>
                                </motion.div>
                            )}

                            {/* ── MEASURING ──
                                Fills the pane instead of being centred in it. The
                                pane clips overflow at BOTH edges, so a tall body
                                (the waiting state, with its live preview) used to
                                push the progress bar up under the header while a
                                short one (the failed state) sat fine — the
                                inconsistency visible between the two states. */}
                            {workflowState === "MEASURING" && (
                                <motion.div key="measuring" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex min-h-0 w-full max-w-3xl flex-1 flex-col mx-auto">
                                    {/* No card of its own — it sits directly on the
                                        flow surface. A bordered panel inside the
                                        panel read as a box within a box. */}
                                    <div className="relative flex min-h-0 flex-1 flex-col p-2 text-center">

                                    {isManual ? (
                                        <>
                                            <div className="flex justify-center mb-4 sm:mb-6 md:mb-8">
                                                <div
                                                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-black"
                                                    style={{ backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent }}
                                                >
                                                    <PencilLine className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                    Manual entry
                                                </div>
                                            </div>

                                            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3" style={textStyle}>Enter your {config.title}</h2>
                                            <p className="text-sm sm:text-base md:text-lg max-w-md mx-auto leading-relaxed mb-4 sm:mb-6 md:mb-8" style={mutedText}>
                                                Type the reading shown on your external device.
                                            </p>

                                            <MeasurementValueForm
                                                metrics={metrics}
                                                ranges={manualRanges}
                                                values={manualValues}
                                                onChange={(key, value) => setManualValues((current) => ({ ...current, [key]: value }))}
                                                onSubmit={handleManualSubmit}
                                                onInvalid={handleManualInvalid}
                                                accent={accent}
                                                accentContent={accentContent}
                                                submitLabel="Review Values"
                                            />
                                        </>
                                    ) : (
                                        <>
                                        {/* Pinned: the bar holds the same place on
                                            screen in every state, so it never shifts
                                            or clips as the body below it changes.
                                            Dropped entirely on failure — a bar
                                            reading "Waiting for finger… 0%" above a
                                            "Measurement Failed" panel contradicts it. */}
                                        {!readingFailed && (
                                            <div className="shrink-0 pb-6">
                                                <MeasurementProgressPanel
                                                    progress={progressView.progress}
                                                    label={progressView.label}
                                                    hint={progressView.hint}
                                                    icon={progressView.icon}
                                                    accent={accent}
                                                    indeterminate={progressView.indeterminate}
                                                    waiting={progressView.waiting}
                                                    lost={progressView.lost}
                                                    countingDown={machineState === "COUNTDOWN"}
                                                />
                                            </div>
                                        )}

                                        <div className="hk-no-scrollbar flex min-h-0 flex-1 flex-col justify-center overflow-y-auto">
                                        {effectiveMachineState === "FAILED" ? (
                                            <div className="py-4">
                                                <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-5 md:mb-6"
                                                    style={{ backgroundColor: "color-mix(in srgb, var(--color-error) 12%, transparent)", color: "var(--color-error)" }}>
                                                    <AlertTriangle className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12" />
                                                </div>
                                                <h2 className="text-lg sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-4" style={textStyle}>Measurement Failed</h2>
                                                <p className="text-sm sm:text-base md:text-xl mb-4 sm:mb-6 md:mb-8 max-w-md mx-auto leading-relaxed" style={mutedText}>{effectiveError || "Please check your position and try again."}</p>
                                                <button
                                                    onClick={handleRetry}
                                                    className="px-5 py-2.5 sm:px-8 sm:py-3.5 md:px-10 md:py-4 rounded-full text-sm md:text-base font-bold border hover:opacity-80 transition-all"
                                                    style={btnSecondary}
                                                >
                                                    Retry Measurement
                                                </button>
                                            </div>
                                        ) : effectiveMachineState === "COMPLETE" ? (
                                            <div className="py-6">
                                                <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-5 md:mb-6"
                                                    style={{ backgroundColor: "color-mix(in srgb, var(--color-success) 12%, transparent)", color: "var(--color-success)" }}>
                                                    <CheckCircle2 className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12" />
                                                </div>
                                                <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-5 md:mb-6" style={textStyle}>Measurement Complete</h2>
                                                <LiveMetricGrid metrics={metrics} source={effectiveFinalResult} accent={accent} live={false} compact />
                                                <p className="text-sm sm:text-base md:text-lg mt-3 sm:mt-5 md:mt-6" style={mutedText}>Preparing your results…</p>
                                            </div>
                                        ) : isLiveReading ? (
                                            <div className="py-4">
                                                <LiveMetricGrid metrics={metrics} source={displayData} accent={accent} live />
                                                <p className="mt-4 sm:mt-6 md:mt-8 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 px-2 text-center" style={mutedText}>
                                                    <Radio className="w-4 h-4 shrink-0 animate-pulse" style={{ color: accent }} />
                                                    Reading updates in real time — hold your position until it's done.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="py-2">
                                                <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto rounded-full flex items-center justify-center mb-2 sm:mb-3 md:mb-4 relative"
                                                    style={{ backgroundColor: "var(--color-surface)" }}>
                                                    <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: accent }} />
                                                    <config.icon className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" style={{ color: accent }} />
                                                </div>
                                                <h2 className="text-base sm:text-xl md:text-2xl font-bold mb-1.5 sm:mb-2" style={textStyle}>Getting Sensor Ready</h2>
                                                <p className="text-xs sm:text-sm md:text-lg max-w-md mx-auto leading-relaxed mb-3 sm:mb-5 md:mb-6" style={mutedText}>{config.positioning}</p>

                                                <div className="max-w-sm mx-auto">
                                                    <p className="text-[0.6rem] sm:text-[0.65rem] font-black uppercase tracking-[0.18em] mb-2 sm:mb-3 flex items-center justify-center gap-1.5" style={mutedText}>
                                                        <Radio className="w-3.5 h-3.5 animate-pulse" style={{ color: accent }} />
                                                        Live Preview
                                                    </p>
                                                    <LiveMetricGrid metrics={metrics} source={displayData} accent={accent} live compact />
                                                </div>
                                            </div>
                                        )}
                                        </div>
                                        </>
                                    )}
                                    </div>
                                </motion.div>
                            )}

                            {/* ── RESULT ── */}
                            {workflowState === "RESULT" && effectiveFinalResult && (
                                <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-2xl mx-auto w-full text-center">
                                    <div className="relative mb-4 sm:mb-6 md:mb-8 overflow-hidden p-1 sm:p-2">
                                        <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-5"
                                            style={{ backgroundColor: "color-mix(in srgb, var(--color-success) 12%, transparent)", color: "var(--color-success)" }}>
                                            <Sparkles className="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                                        </div>
                                        <h2 className="text-xs sm:text-base md:text-lg font-bold mb-4 sm:mb-6 md:mb-8 uppercase tracking-widest" style={mutedText}>
                                            {isManual ? "Review Values" : "Final Result"}
                                        </h2>
                                        <LiveMetricGrid metrics={metrics} source={effectiveFinalResult} accent={accent} live={false} />

                                        {isManual && (
                                            <p className="mt-3 sm:mt-5 md:mt-6 inline-flex items-center gap-2 text-xs sm:text-sm font-bold" style={mutedText}>
                                                <PencilLine className="w-4 h-4 shrink-0" style={{ color: accent }} />
                                                Entered manually from an external device
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-6">
                                        <button
                                            onClick={handleRetry}
                                            className="px-4 py-2.5 sm:px-6 sm:py-4 md:px-8 md:py-5 rounded-full text-sm sm:text-lg md:text-xl font-bold border hover:opacity-80 transition-all"
                                            style={btnSecondary}
                                        >
                                            {isManual ? "Edit" : "Retake"}
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="px-6 py-2.5 sm:px-9 sm:py-4 md:px-12 md:py-5 rounded-full text-sm sm:text-lg md:text-xl font-bold transition-all active:scale-95 flex items-center gap-2 md:gap-3 shadow-xl hover:opacity-90 disabled:opacity-60"
                                            style={{ backgroundColor: accent, color: accentContent, boxShadow: `0 20px 25px -5px color-mix(in srgb, ${accent} 25%, transparent)` }}
                                        >
                                            {saving ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 animate-spin" /> : <Save className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />}
                                            Confirm and Save
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* ── SAVED ──
                                Shared terminal step: both modes land here so the
                                flow always ends with the same confirmation. */}
                            {workflowState === "SAVED" && (
                                <motion.div key="saved" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-2xl mx-auto w-full text-center">
                                    <div className="p-1 sm:p-2">
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                            className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-5 md:mb-6"
                                            style={{ backgroundColor: "color-mix(in srgb, var(--color-success) 12%, transparent)", color: "var(--color-success)" }}
                                        >
                                            <CheckCircle2 className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12" />
                                        </motion.div>

                                        <h2 className="text-lg sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-5 md:mb-6" style={textStyle}>Measurement Saved</h2>

                                        {effectiveFinalResult && (
                                            <LiveMetricGrid metrics={metrics} source={effectiveFinalResult} accent={accent} live={false} compact />
                                        )}

                                        <p className="text-sm sm:text-base md:text-lg mt-4 sm:mt-6 md:mt-8" style={mutedText}>Returning to your health checks…</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.section>

            {/* Not a failure — the kiosk simply never saw anyone. Only reachable
                from the Reading step, and never while a result is settling. */}
            <MeasurementNotDetectedModal
                open={progressView.notDetected && workflowState === "MEASURING" && !isManual}
                measurementTitle={config.title}
                hint={progressView.hint}
                accent={accent}
                accentContent={accentContent}
                onRetry={handleRetryDetection}
                onCancel={handleCancelDetection}
            />
        </div>
    );
}
