import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { RotateCcw, ScanSearch, X } from "lucide-react";
import useModalLayer from "../../../../Global/useModalLayer";

/**
 * Shown when the sensor never detected the person within the timeout.
 *
 * Distinct from a measurement *failure*: nothing went wrong, the kiosk simply
 * never saw anyone. The copy is an instruction, not an error.
 */
export default function MeasurementNotDetectedModal({
    open,
    measurementTitle,
    hint,
    accent = "var(--color-primary)",
    accentContent = "var(--color-primary-content)",
    onRetry,
    onCancel,
}) {
    const shouldReduceMotion = useReducedMotion();
    const primaryRef = useRef(null);
    const dialogRef = useRef(null);

    useModalLayer(open);

    useEffect(() => {
        if (!open) return undefined;
        const id = window.setTimeout(() => primaryRef.current?.focus(), 80);
        return () => window.clearTimeout(id);
    }, [open]);

    useEffect(() => {
        if (!open) return undefined;

        const onKeyDown = (event) => {
            if (event.key === "Escape") {
                event.stopPropagation();
                onCancel?.();
                return;
            }

            if (event.key !== "Tab") return;

            const focusable = dialogRef.current?.querySelectorAll(
                'button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])',
            );
            if (!focusable?.length) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        window.addEventListener("keydown", onKeyDown, true);
        return () => window.removeEventListener("keydown", onKeyDown, true);
    }, [open, onCancel]);

    const modal = (
        <AnimatePresence>
            {open ? (
                <motion.div
                    className="fixed inset-0 z-[9200] flex items-center justify-center px-4 py-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: shouldReduceMotion ? 0.01 : 0.22 }}
                    style={{ backgroundColor: "rgba(4, 8, 18, 0.62)", backdropFilter: "blur(14px)" }}
                >
                    <button
                        type="button"
                        aria-label="Cancel"
                        onClick={onCancel}
                        className="absolute inset-0 cursor-default"
                    />

                    <motion.div
                        ref={dialogRef}
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="not-detected-title"
                        aria-describedby="not-detected-message"
                        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 26, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
                        transition={
                            shouldReduceMotion
                                ? { duration: 0.01 }
                                : { type: "spring", stiffness: 320, damping: 28, mass: 0.8 }
                        }
                        className="relative z-10 w-full max-w-lg overflow-hidden rounded-[2rem] border text-center shadow-2xl"
                        style={{
                            backgroundColor: "var(--color-card)",
                            borderColor: "var(--color-border)",
                            color: "var(--color-text)",
                            boxShadow: "0 40px 80px -30px rgba(0,0,0,0.55)",
                        }}
                    >
                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-x-0 top-0 h-40"
                            style={{
                                background: `radial-gradient(120% 100% at 50% 0%, color-mix(in srgb, ${accent} 15%, transparent), transparent 70%)`,
                            }}
                        />
                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-x-0 top-0 h-1"
                            style={{ backgroundColor: accent }}
                        />

                        <button
                            type="button"
                            onClick={onCancel}
                            aria-label="Cancel"
                            className="absolute right-5 top-5 z-20 rounded-xl border p-2 transition hover:opacity-70"
                            style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}
                        >
                            <X size={16} />
                        </button>

                        <div className="relative px-5 pb-6 pt-9 sm:px-8 sm:pb-8 sm:pt-12">
                            <motion.div
                                initial={shouldReduceMotion ? false : { scale: 0.7, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.06, duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                                className="relative mx-auto flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center rounded-2xl sm:rounded-3xl"
                                style={{
                                    backgroundColor: "color-mix(in srgb, var(--color-info) 14%, transparent)",
                                    color: "var(--color-info)",
                                }}
                            >
                                {!shouldReduceMotion && (
                                    <motion.span
                                        aria-hidden="true"
                                        className="absolute inset-0 rounded-2xl sm:rounded-3xl"
                                        style={{ backgroundColor: "var(--color-info)" }}
                                        animate={{ opacity: [0.18, 0, 0.18], scale: [1, 1.22, 1] }}
                                        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                                    />
                                )}
                                <ScanSearch size={24} className="relative sm:hidden" />
                                <ScanSearch size={34} className="relative hidden sm:block" />
                            </motion.div>

                            <h2
                                id="not-detected-title"
                                className="mt-4 sm:mt-6 text-xl sm:text-3xl font-black tracking-tight"
                                style={{ letterSpacing: "-0.02em" }}
                            >
                                Measurement Not Detected
                            </h2>

                            <p
                                id="not-detected-message"
                                className="mx-auto mt-3 sm:mt-4 max-w-md text-sm sm:text-base font-semibold leading-6 sm:leading-7"
                                style={{ color: "var(--color-muted)" }}
                            >
                                We couldn't detect the required sensor input
                                {measurementTitle ? ` for ${measurementTitle}` : ""}.
                                {" "}
                                Please check your position and try again.
                            </p>

                            {hint ? (
                                <p
                                    className="mx-auto mt-3 max-w-md text-xs sm:text-sm font-semibold leading-5 sm:leading-6"
                                    style={{ color: "var(--color-muted)" }}
                                >
                                    {hint}
                                </p>
                            ) : null}

                            <div className="mt-6 sm:mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                                <motion.button
                                    type="button"
                                    onClick={onCancel}
                                    whileHover={shouldReduceMotion ? undefined : { y: -2 }}
                                    whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                                    className="rounded-full border px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-black transition hover:opacity-80"
                                    style={{
                                        backgroundColor: "var(--color-surface)",
                                        borderColor: "var(--color-border)",
                                        color: "var(--color-text)",
                                    }}
                                >
                                    Cancel
                                </motion.button>

                                <motion.button
                                    ref={primaryRef}
                                    type="button"
                                    onClick={onRetry}
                                    whileHover={shouldReduceMotion ? undefined : { y: -2 }}
                                    whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                                    className="inline-flex items-center justify-center gap-2 sm:gap-2.5 rounded-full px-7 py-3 sm:px-9 sm:py-4 text-sm sm:text-base font-black outline-none transition focus-visible:ring-4"
                                    style={{
                                        backgroundColor: accent,
                                        color: accentContent,
                                        boxShadow: `0 18px 30px -14px color-mix(in srgb, ${accent} 90%, transparent)`,
                                    }}
                                >
                                    <RotateCcw size={16} className="sm:hidden" />
                                    <RotateCcw size={18} className="hidden sm:block" />
                                    Try Again
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );

    return createPortal(modal, document.body);
}
