import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PencilLine, Wrench, X } from "lucide-react";
import useModalLayer from "../../../../Global/useModalLayer";

/**
 * Shown when someone picks a health check whose sensor an administrator has
 * taken out of service.
 *
 * Deliberately never a dead end: the primary action drops straight into the
 * Manual Mode flow for the same measurement, so the person in front of the
 * kiosk always leaves this dialog with their reading still ahead of them.
 */
export default function SmartModeUnavailableModal({ open, measurement, onUseManual, onClose }) {
    const shouldReduceMotion = useReducedMotion();
    const primaryRef = useRef(null);
    const dialogRef = useRef(null);

    useModalLayer(open);

    // Manual Mode is the way forward, so it is what receives focus — Enter
    // alone is enough to continue.
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
                onClose?.();
                return;
            }

            if (event.key !== "Tab") return;

            // Keep focus inside the dialog: on a kiosk there is nothing
            // meaningful to tab away to, and the page behind is inert.
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
    }, [open, onClose]);

    const accent = measurement?.accent || "var(--color-primary)";
    const title = measurement?.title || measurement?.label || "this measurement";
    const Icon = measurement?.icon;

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
                        aria-label="Close"
                        onClick={onClose}
                        className="absolute inset-0 cursor-default"
                    />

                    <motion.div
                        ref={dialogRef}
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="smart-unavailable-title"
                        aria-describedby="smart-unavailable-message"
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
                        {/* Wash in the measurement's own colour so the dialog
                            reads as belonging to the check that was tapped. */}
                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-x-0 top-0 h-40"
                            style={{
                                background: `radial-gradient(120% 100% at 50% 0%, color-mix(in srgb, ${accent} 16%, transparent), transparent 70%)`,
                            }}
                        />
                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-x-0 top-0 h-1"
                            style={{ backgroundColor: accent }}
                        />

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
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
                                    backgroundColor: "color-mix(in srgb, var(--color-warning) 14%, transparent)",
                                    color: "var(--color-warning)",
                                }}
                            >
                                {!shouldReduceMotion && (
                                    <motion.span
                                        aria-hidden="true"
                                        className="absolute inset-0 rounded-2xl sm:rounded-3xl"
                                        style={{ backgroundColor: "var(--color-warning)" }}
                                        animate={{ opacity: [0.18, 0, 0.18], scale: [1, 1.22, 1] }}
                                        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                                    />
                                )}
                                <Wrench size={24} className="relative sm:hidden" />
                                <Wrench size={34} className="relative hidden sm:block" />
                            </motion.div>

                            {/* Names the measurement the person actually tapped,
                                so the dialog is not generic maintenance noise. */}
                            <div
                                className="mx-auto mt-4 sm:mt-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 sm:px-3.5 sm:py-1.5 text-[0.65rem] sm:text-xs font-black uppercase tracking-[0.14em]"
                                style={{
                                    backgroundColor: `color-mix(in srgb, ${accent} 9%, transparent)`,
                                    borderColor: `color-mix(in srgb, ${accent} 26%, transparent)`,
                                    color: accent,
                                }}
                            >
                                {Icon ? <Icon size={14} /> : null}
                                {title}
                            </div>

                            <h2
                                id="smart-unavailable-title"
                                className="mt-3 sm:mt-4 text-xl sm:text-3xl font-black tracking-tight"
                                style={{ letterSpacing: "-0.02em" }}
                            >
                                Smart Mode Unavailable
                            </h2>

                            <p
                                id="smart-unavailable-message"
                                className="mx-auto mt-3 sm:mt-4 max-w-md text-sm sm:text-base font-semibold leading-6 sm:leading-7"
                                style={{ color: "var(--color-muted)" }}
                            >
                                Smart Mode is currently unavailable for this measurement. Please use Manual Mode
                                temporarily while this sensor is under maintenance.
                            </p>

                            <div className="mt-6 sm:mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                                <motion.button
                                    type="button"
                                    onClick={onClose}
                                    whileHover={shouldReduceMotion ? undefined : { y: -2 }}
                                    whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                                    className="rounded-full border px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-black transition hover:opacity-80"
                                    style={{
                                        backgroundColor: "var(--color-surface)",
                                        borderColor: "var(--color-border)",
                                        color: "var(--color-text)",
                                    }}
                                >
                                    Close
                                </motion.button>

                                <motion.button
                                    ref={primaryRef}
                                    type="button"
                                    onClick={onUseManual}
                                    whileHover={shouldReduceMotion ? undefined : { y: -2 }}
                                    whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                                    className="inline-flex items-center justify-center gap-2 sm:gap-2.5 rounded-full px-7 py-3 sm:px-9 sm:py-4 text-sm sm:text-base font-black outline-none transition focus-visible:ring-4"
                                    style={{
                                        backgroundColor: "var(--color-primary)",
                                        color: "var(--color-primary-content)",
                                        boxShadow: "0 18px 30px -14px color-mix(in srgb, var(--color-primary) 90%, transparent)",
                                    }}
                                >
                                    <PencilLine size={16} className="sm:hidden" />
                                    <PencilLine size={18} className="hidden sm:block" />
                                    Use Manual Mode
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
