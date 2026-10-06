import { motion, useReducedMotion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];

/**
 * Full-screen (or inline) loading state.
 *
 * Built to the same restraint as the measurement mode announcement: a soft
 * colour field, a quiet badge, and type that rises into place from behind a
 * mask. The old version was a bare spinner ring around an icon — legible, but
 * it read as a placeholder rather than part of the product.
 */
export default function Loader({ label = "Loading", message = "Preparing your workspace", fullscreen = false }) {
    const reduce = useReducedMotion();

    const content = (
        <div className="relative flex w-[min(90vw,26rem)] flex-col items-center px-8 py-10 text-center">
            {/* Colour field behind the composition. Centred by a flex parent
                rather than translate utilities — framer writes its own
                transform for the breathing animation and would override them. */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
                <motion.div
                    aria-hidden="true"
                    className="h-[26rem] w-[26rem] shrink-0 rounded-full"
                    style={{
                        background: "radial-gradient(circle, color-mix(in srgb, var(--color-primary) 22%, transparent), transparent 65%)",
                        filter: "blur(14px)",
                    }}
                    initial={reduce ? false : { opacity: 0, scale: 0.85 }}
                    animate={reduce ? { opacity: 1 } : { opacity: [0.7, 1, 0.7], scale: [0.92, 1.04, 0.92] }}
                    transition={reduce ? { duration: 0.01 } : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>

            {/* Badge with a single orbiting arc — one moving part, not a ring
                of competing spinners. */}
            <div className="relative mb-7 flex h-20 w-20 items-center justify-center">
                <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
                    <circle cx="40" cy="40" r="36" fill="none" strokeWidth="2.5"
                        stroke="color-mix(in srgb, var(--color-primary) 14%, transparent)" />
                    <motion.circle
                        cx="40" cy="40" r="36" fill="none" strokeWidth="2.5" strokeLinecap="round"
                        stroke="var(--color-primary)"
                        strokeDasharray="56 170"
                        initial={{ rotate: 0 }}
                        animate={reduce ? { rotate: 0 } : { rotate: 360 }}
                        transition={reduce ? { duration: 0.01 } : { duration: 1.15, repeat: Infinity, ease: "linear" }}
                        style={{ transformOrigin: "40px 40px" }}
                    />
                </svg>

                <motion.div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{
                        backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, var(--color-card))",
                        color: "var(--color-primary)",
                    }}
                    initial={reduce ? false : { scale: 0.9, opacity: 0 }}
                    animate={reduce ? { scale: 1, opacity: 1 } : { scale: [1, 1.04, 1], opacity: 1 }}
                    transition={reduce ? { duration: 0.01 } : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                >
                    <ShieldCheck size={26} />
                </motion.div>
            </div>

            <MaskedLine reduce={reduce} delay={0.05}>
                <span className="text-xl font-black tracking-tight" style={{ color: "var(--color-text)" }}>
                    {label}
                </span>
            </MaskedLine>

            <motion.p
                className="relative mt-2.5 max-w-xs text-sm font-medium leading-6"
                style={{ color: "var(--color-muted)" }}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: reduce ? 0 : 0.16, ease: EASE }}
            >
                {message}
            </motion.p>

            {/* Indeterminate bar — the wait has no known length, so this shows
                activity rather than pretending to know progress. */}
            <div
                className="relative mt-7 h-1 w-40 overflow-hidden rounded-full"
                style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, transparent)" }}
            >
                {reduce ? null : (
                    <motion.span
                        aria-hidden="true"
                        className="absolute inset-y-0 w-1/2 rounded-full"
                        style={{ backgroundColor: "var(--color-primary)" }}
                        initial={{ left: "-50%" }}
                        animate={{ left: "100%" }}
                        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                    />
                )}
            </div>
        </div>
    );

    if (!fullscreen) {
        return <div className="flex min-h-[240px] items-center justify-center">{content}</div>;
    }

    return (
        <div
            className="fixed inset-0 z-[9400] flex items-center justify-center p-6"
            role="status"
            aria-live="polite"
            aria-busy="true"
            style={{
                // Near-opaque so the page behind cannot compete with the type.
                backgroundColor: "color-mix(in srgb, var(--color-bg) 94%, transparent)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
            }}
        >
            {content}
        </div>
    );
}

/** A line of type rising from behind a clipping edge. */
function MaskedLine({ children, delay = 0, reduce }) {
    return (
        <span className="relative block overflow-hidden">
            <motion.span
                className="block"
                initial={reduce ? false : { y: "110%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 0.6, delay: reduce ? 0 : delay, ease: EASE }}
            >
                {children}
            </motion.span>
        </span>
    );
}
