import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
    AlertTriangle, BarChart3, Check, Database, FileSpreadsheet, FileText, Loader2, RotateCcw, Wand2,
} from "lucide-react";
import useModalLayer from "../../../../Global/useModalLayer";

/**
 * Generation sequence for Clinic Reports.
 *
 * Built to read like the rest of the Admin Command Center — same card, border,
 * ambient glow and badge language as ReportsHeader — rather than as a generic
 * spinner modal. The stages are a visible checklist because that is what an
 * admin can actually follow and present.
 *
 * ── Progress model ──
 * One authoritative value, held in a ref and driven by a single rAF loop, so
 * re-renders cannot disturb it and two timers can never fight.
 *
 * It is *perceived* progress: elapsed time is mapped through a curve that moves
 * quickly to 80, slows to 95, then crawls to a 99 ceiling and waits there. The
 * ceiling is the honest part — only the caller flipping status to "success",
 * which happens when the request has actually returned, releases it to 100.
 *
 * Every write goes through a max() against the previous value, so the bar is
 * monotonic by construction: it cannot step backward on a re-render, a stale
 * response, or a reopen.
 *
 * The previous version computed `((stageIndex + 1) / STAGES.length) * 88`,
 * which started at 22%, moved in four jumps, and pinned at 88 — and animated
 * the bar with a spring, whose overshoot settled backward and read as a
 * countdown. Both are gone: the width is written straight from the rAF value.
 */

/** Progress ceiling while the request is still in flight. */
const CEILING = 99;

/** Time to cross each band of the perceived-progress curve. */
const FAST_MS = 1500;   //  0 → 80
const MID_MS = 2600;    // 80 → 95
const SLOW_MS = 7000;   // 95 → 99

const STAGES = [
    { key: "collect", label: "Collecting health records", icon: Database, until: 25 },
    { key: "analyze", label: "Analyzing vital trends", icon: BarChart3, until: 55 },
    { key: "compile", label: "Compiling report data", icon: FileSpreadsheet, until: 80 },
    { key: "finalize", label: "Finalizing report", icon: Wand2, until: 100 },
];

/** Minimum on-screen time before success may show, so a fast response still reads as a sequence. */
export const GENERATION_MIN_MS = 2400;
/** How long the completed state stays up before the overlay closes itself. */
export const GENERATION_SUCCESS_HOLD_MS = 2200;

const easeOutQuad = (t) => t * (2 - t);
const easeOutCubic = (t) => 1 - (1 - t) ** 3;

/**
 * Elapsed milliseconds → percentage.
 *
 * Continuous and strictly increasing across the three bands, approaching the
 * ceiling asymptotically rather than ever touching 100.
 */
function perceivedProgress(elapsed) {
    if (elapsed <= FAST_MS) {
        return easeOutQuad(elapsed / FAST_MS) * 80;
    }

    const afterFast = elapsed - FAST_MS;
    if (afterFast <= MID_MS) {
        return 80 + (afterFast / MID_MS) * 15;
    }

    const afterMid = afterFast - MID_MS;
    return 95 + Math.min(CEILING - 95, (afterMid / SLOW_MS) * (CEILING - 95));
}

/** Index of the stage the current percentage falls in. */
function stageIndexFor(progress) {
    const index = STAGES.findIndex((stage) => progress < stage.until);
    return index === -1 ? STAGES.length - 1 : index;
}

export default function ReportGenerationOverlay({ open, status = "running", count = 0, onDone, onRetry }) {
    const shouldReduceMotion = useReducedMotion();
    const [progress, setProgress] = useState(0);

    useModalLayer(open);

    const succeeded = status === "success";
    const failed = status === "error";

    // The single source of truth for the bar. State only mirrors it for render,
    // so a re-render can never move progress on its own.
    const progressRef = useRef(0);
    const startedAtRef = useRef(0);
    const frameRef = useRef(0);

    /** Monotonic write — the only place progress is allowed to change. */
    const advanceTo = useCallback((value) => {
        const next = Math.min(100, Math.max(progressRef.current, value));
        if (next === progressRef.current) return;

        progressRef.current = next;
        setProgress(next);
    }, []);

    // Reset only on a genuine close, never mid-flight.
    useEffect(() => {
        if (open) return;

        progressRef.current = 0;
        startedAtRef.current = 0;
        setProgress(0);
    }, [open]);

    // Perceived progress while the request is in flight.
    useEffect(() => {
        if (!open || status !== "running") return undefined;

        // Guarded so a re-render with the same status resumes the existing
        // timeline instead of restarting it from zero.
        if (!startedAtRef.current) startedAtRef.current = performance.now();

        const tick = () => {
            advanceTo(perceivedProgress(performance.now() - startedAtRef.current));
            frameRef.current = requestAnimationFrame(tick);
        };

        frameRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameRef.current);
    }, [open, status, advanceTo]);

    // Release to 100 once generation has actually finished. The sweep is timed
    // to the distance left, so a request that returned early glides up instead
    // of snapping from wherever it had reached.
    useEffect(() => {
        if (!open || !succeeded) return undefined;

        const from = progressRef.current;
        const distance = 100 - from;

        if (distance <= 0) return undefined;

        const duration = shouldReduceMotion ? 1 : Math.min(760, Math.max(280, distance * 8));
        const startedAt = performance.now();

        const tick = () => {
            const t = Math.min(1, (performance.now() - startedAt) / duration);
            advanceTo(from + distance * easeOutCubic(t));

            if (t < 1) frameRef.current = requestAnimationFrame(tick);
        };

        frameRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameRef.current);
    }, [open, succeeded, shouldReduceMotion, advanceTo]);

    // Held in a ref so the auto-close timer below is not restarted every time
    // the parent re-renders with a fresh inline callback — that reset was why
    // the panel could sit on "Successful" without ever closing.
    const onDoneRef = useRef(onDone);
    useEffect(() => {
        onDoneRef.current = onDone;
    }, [onDone]);

    useEffect(() => {
        if (!open || !succeeded) return undefined;

        const timer = window.setTimeout(() => onDoneRef.current?.(), GENERATION_SUCCESS_HOLD_MS);
        return () => window.clearTimeout(timer);
    }, [open, succeeded]);

    const activeStage = stageIndexFor(progress);
    const tone = succeeded
        ? "var(--color-success)"
        : failed
            ? "var(--color-error)"
            : "var(--color-primary)";

    const title = succeeded ? "Report Ready" : failed ? "Unable to Generate Report" : "Generating Your Report";
    const blurb = succeeded
        ? count > 0
            ? `Your health report has been generated. ${count.toLocaleString()} ${count === 1 ? "record is" : "records are"} ready to export.`
            : "Your health report has been generated. No records matched the selected filters."
        : failed
            ? "We couldn't complete the report generation. Please try again."
            : "Compiling health analytics from your selected date range.";

    const overlay = (
        <AnimatePresence>
            {open ? (
                <motion.div
                    className="fixed inset-0 z-[9300] flex items-center justify-center px-4 py-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: shouldReduceMotion ? 0.01 : 0.22 }}
                    style={{ backgroundColor: "rgba(4, 8, 18, 0.66)", backdropFilter: "blur(14px)" }}
                    role="status"
                    aria-live="polite"
                >
                    <motion.div
                        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 18 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 10 }}
                        transition={
                            shouldReduceMotion
                                ? { duration: 0.01 }
                                : { type: "spring", stiffness: 300, damping: 26, mass: 0.8 }
                        }
                        className="relative w-full max-w-lg overflow-hidden rounded-3xl border p-6 shadow-2xl sm:p-7"
                        style={{
                            backgroundColor: "var(--color-card)",
                            borderColor: succeeded || failed
                                ? `color-mix(in srgb, ${tone} 32%, var(--color-border))`
                                : "var(--color-border)",
                            color: "var(--color-text)",
                        }}
                    >
                        {/* Same ambient glow the Clinic Reports header uses. */}
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-20 blur-3xl transition-colors duration-500"
                            style={{ backgroundColor: tone }}
                        />

                        {/* -- Header -- */}
                        <div className="relative z-10 flex items-start gap-4">
                            <div
                                className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border shadow-lg transition-colors duration-500"
                                style={{
                                    backgroundColor: `color-mix(in srgb, ${tone} 12%, var(--color-surface))`,
                                    borderColor: `color-mix(in srgb, ${tone} 30%, transparent)`,
                                    color: tone,
                                }}
                            >
                                {!shouldReduceMotion && !succeeded && !failed ? (
                                    <motion.span
                                        aria-hidden="true"
                                        className="absolute inset-0 rounded-2xl border"
                                        style={{ borderColor: "color-mix(in srgb, var(--color-primary) 45%, transparent)" }}
                                        animate={{ scale: [1, 1.16, 1], opacity: [0.7, 0, 0.7] }}
                                        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                                    />
                                ) : null}

                                <AnimatePresence mode="wait" initial={false}>
                                    <motion.span
                                        key={status}
                                        initial={shouldReduceMotion ? false : { scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={shouldReduceMotion ? undefined : { scale: 0.5, opacity: 0 }}
                                        transition={
                                            shouldReduceMotion
                                                ? { duration: 0.01 }
                                                : { type: "spring", stiffness: 420, damping: 18 }
                                        }
                                        className="relative"
                                    >
                                        {succeeded ? <Check size={30} strokeWidth={3} />
                                            : failed ? <AlertTriangle size={28} />
                                                : <FileText size={28} />}
                                    </motion.span>
                                </AnimatePresence>
                            </div>

                            <div className="min-w-0 flex-1">
                                <span
                                    className="inline-block rounded-md border px-2.5 py-0.5 text-[0.68rem] font-black uppercase tracking-widest transition-colors duration-500"
                                    style={{
                                        backgroundColor: `color-mix(in srgb, ${tone} 14%, var(--color-surface))`,
                                        borderColor: `color-mix(in srgb, ${tone} 30%, transparent)`,
                                        color: tone,
                                    }}
                                >
                                    {succeeded ? "Report Ready" : failed ? "Generation Failed" : "Generating"}
                                </span>

                                <AnimatePresence mode="wait" initial={false}>
                                    <motion.div
                                        key={status}
                                        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
                                        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                                    >
                                        <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-[1.75rem]" style={{ color: "var(--color-text)" }}>
                                            {title}
                                        </h2>
                                        <p className="mt-1 text-xs font-bold leading-6 sm:text-sm" style={{ color: "var(--color-muted)" }}>
                                            {blurb}
                                        </p>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* -- Progress -- */}
                        {!failed ? (
                            <div className="relative z-10 mt-6">
                                <div className="mb-2 flex items-baseline justify-between gap-3">
                                    <AnimatePresence mode="wait" initial={false}>
                                        <motion.span
                                            key={succeeded ? "done" : STAGES[activeStage].key}
                                            initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
                                            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                                            className="truncate text-sm font-black"
                                            style={{ color: "var(--color-text)" }}
                                        >
                                            {succeeded ? "Report ready" : STAGES[activeStage].label}
                                        </motion.span>
                                    </AnimatePresence>

                                    <span className="shrink-0 text-sm font-black tabular-nums transition-colors duration-500" style={{ color: tone }}>
                                        {Math.round(progress)}%
                                    </span>
                                </div>

                                <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-border)" }}>
                                    {/* Width comes straight from the rAF value, with no spring, so it
                                        cannot overshoot the target and settle backward. */}
                                    <div
                                        className="h-full rounded-full"
                                        style={{
                                            width: `${progress}%`,
                                            background: `linear-gradient(90deg, color-mix(in srgb, ${tone} 55%, transparent), ${tone})`,
                                            boxShadow: `0 0 14px -2px color-mix(in srgb, ${tone} 75%, transparent)`,
                                            transition: "background 500ms ease, box-shadow 500ms ease",
                                        }}
                                    />
                                </div>
                            </div>
                        ) : null}

                        {/* -- Stage checklist -- */}
                        {!failed ? (
                            <div className="relative z-10 mt-5 space-y-2">
                                {STAGES.map((stage, index) => (
                                    <StageRow
                                        key={stage.key}
                                        stage={stage}
                                        index={index}
                                        state={
                                            succeeded || index < activeStage
                                                ? "done"
                                                : index === activeStage
                                                    ? "active"
                                                    : "pending"
                                        }
                                        shouldReduceMotion={shouldReduceMotion}
                                    />
                                ))}
                            </div>
                        ) : null}

                        {/* -- Actions -- */}
                        <AnimatePresence initial={false}>
                            {succeeded || failed ? (
                                <motion.div
                                    key="action"
                                    initial={shouldReduceMotion ? false : { opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={shouldReduceMotion ? undefined : { opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                    className="relative z-10 overflow-hidden"
                                >
                                    {failed ? (
                                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                            <button
                                                type="button"
                                                onClick={() => onRetry?.()}
                                                className="flex flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]"
                                                style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-content)" }}
                                            >
                                                <RotateCcw size={17} />
                                                Try Again
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onDoneRef.current?.()}
                                                className="rounded-2xl border px-5 py-3 text-sm font-black transition hk-soft-hover"
                                                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                                            >
                                                Close
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => onDoneRef.current?.()}
                                            className="mt-6 w-full rounded-2xl px-5 py-3 text-sm font-black shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]"
                                            style={{ backgroundColor: "var(--color-success)", color: "var(--color-success-content)" }}
                                        >
                                            View Report
                                        </button>
                                    )}
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );

    return createPortal(overlay, document.body);
}

/**
 * One row of the checklist.
 *
 * Completed shows a check, the current stage a spinner, upcoming a hollow dot —
 * so the three states are distinguishable without relying on colour alone.
 */
function StageRow({ stage, index, state, shouldReduceMotion }) {
    const Icon = stage.icon;
    const done = state === "done";
    const active = state === "active";
    const tone = done ? "var(--color-success)" : active ? "var(--color-primary)" : "var(--color-muted)";

    return (
        <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: state === "pending" ? 0.45 : 1, x: 0 }}
            transition={
                shouldReduceMotion
                    ? { duration: 0.01 }
                    : { duration: 0.34, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }
            }
            className="flex items-center gap-3 rounded-2xl border px-3.5 py-2.5 transition-colors duration-300"
            style={{
                backgroundColor: active
                    ? "color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))"
                    : "var(--color-surface)",
                borderColor: active
                    ? "color-mix(in srgb, var(--color-primary) 28%, transparent)"
                    : "var(--color-border)",
            }}
        >
            <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors duration-300"
                style={{ backgroundColor: `color-mix(in srgb, ${tone} 13%, transparent)`, color: tone }}
            >
                <Icon size={15} />
            </span>

            <span className="min-w-0 flex-1 truncate text-xs font-black sm:text-sm" style={{ color: "var(--color-text)" }}>
                {stage.label}
            </span>

            <span className="shrink-0" style={{ color: tone }}>
                {done ? (
                    <motion.span
                        initial={shouldReduceMotion ? false : { scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={
                            shouldReduceMotion
                                ? { duration: 0.01 }
                                : { type: "spring", stiffness: 460, damping: 18 }
                        }
                        className="block"
                    >
                        <Check size={16} strokeWidth={3} />
                    </motion.span>
                ) : active ? (
                    <Loader2 size={15} className={shouldReduceMotion ? "" : "animate-spin"} />
                ) : (
                    <span
                        className="block h-2.5 w-2.5 rounded-full border-2"
                        style={{ borderColor: "var(--color-muted)" }}
                    />
                )}
            </span>
        </motion.div>
    );
}
