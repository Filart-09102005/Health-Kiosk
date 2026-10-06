import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import WaveIndicator from "./WaveIndicator";

const DONE_HOLD_MS = 1600;
/**
 * Ceiling on the working state.
 *
 * The button follows onExport's promise, but an export can hand off to a popup
 * that blocks the shared event loop with a print dialog - so the release render
 * could arrive much later than the work actually took. This guarantees the
 * button is never left spinning at someone who has already got their file.
 */
const WORKING_MAX_MS = 12000;

/**
 * Export button with a full idle → working → done cycle.
 *
 * The label stays put throughout: only the leading icon changes, so the button
 * never resizes mid-download. A sweeping fill communicates that work is
 * happening, and a brief tick confirms it finished — previously the spinner
 * replaced the whole label and then simply vanished, leaving no signal that
 * the file had actually been produced.
 *
 * @param onExport async fn; the button follows its lifecycle.
 */
export default function ExportActionButton({
    label,
    icon: Icon,
    onExport,
    disabled = false,
    title,
    accent = "var(--color-primary)",
    iconColor,
    className = "",
    style = {},
}) {
    const [state, setState] = useState("idle"); // idle | working | done
    const aliveRef = useRef(true);

    // The flag must be raised in setup, not just lowered in cleanup. With only a
    // cleanup, StrictMode's mount / unmount / remount pass left it false for the
    // component's whole life, so every guarded setState below was skipped and the
    // button could never leave "working" - the file downloaded, the promise
    // resolved, and nothing on screen ever moved.
    useEffect(() => {
        aliveRef.current = true;
        return () => { aliveRef.current = false; };
    }, []);

    useEffect(() => {
        if (state !== "done") return undefined;
        const timer = window.setTimeout(() => {
            if (aliveRef.current) setState("idle");
        }, DONE_HOLD_MS);
        return () => window.clearTimeout(timer);
    }, [state]);

    useEffect(() => {
        if (state !== "working") return undefined;
        const timer = window.setTimeout(() => {
            if (aliveRef.current) setState("idle");
        }, WORKING_MAX_MS);
        return () => window.clearTimeout(timer);
    }, [state]);

    const run = async () => {
        if (state !== "idle" || disabled) return;

        setState("working");
        try {
            // A handler that returns false did not produce a file (no matching
            // records, or a failed request). Showing the confirming tick there
            // would claim something was saved when nothing was.
            const exported = await onExport?.();
            if (aliveRef.current) setState(exported === false ? "idle" : "done");
        } catch {
            // The caller surfaces the error; just release the button.
            if (aliveRef.current) setState("idle");
        }
    };

    const working = state === "working";
    const done = state === "done";

    return (
        <button
            type="button"
            onClick={run}
            disabled={disabled || working}
            title={title}
            aria-busy={working}
            className={`relative inline-flex h-9 items-center justify-center gap-1.5 overflow-hidden rounded-xl border px-3.5 text-xs font-black transition-all hk-soft-hover disabled:cursor-not-allowed ${className}`}
            style={style}
        >
            {/* Indeterminate sweep — the file size is unknown, so this shows
                activity rather than pretending to know progress. */}
            <AnimatePresence>
                {working ? (
                    <motion.span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 w-1/2"
                        style={{
                            background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${accent} 24%, transparent), transparent)`,
                        }}
                        initial={{ left: "-50%" }}
                        animate={{ left: "100%" }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                    />
                ) : null}
            </AnimatePresence>

            <span className="relative flex h-4 w-4 items-center justify-center">
                <AnimatePresence mode="wait" initial={false}>
                    {working ? (
                        <motion.span
                            key="working"
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.6 }}
                            transition={{ duration: 0.14 }}
                            className="absolute"
                        >
                            <WaveIndicator size={16} color={accent} />
                        </motion.span>
                    ) : done ? (
                        <motion.span
                            key="done"
                            initial={{ opacity: 0, scale: 0.4 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.6 }}
                            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute"
                            style={{ color: "var(--color-success)" }}
                        >
                            <Check size={15} strokeWidth={3} />
                        </motion.span>
                    ) : (
                        <motion.span
                            key="idle"
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.6 }}
                            transition={{ duration: 0.14 }}
                            className="absolute"
                            style={iconColor ? { color: iconColor } : undefined}
                        >
                            {Icon ? <Icon size={14} /> : null}
                        </motion.span>
                    )}
                </AnimatePresence>
            </span>

            {/* Label never swaps out, so the button keeps its width. */}
            <span className="relative">{done ? "Saved" : label}</span>
        </button>
    );
}
