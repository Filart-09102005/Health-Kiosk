import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createPortal } from "react-dom";
import { Cpu, PencilLine } from "lucide-react";
import { MEASUREMENT_MODES } from "../hooks/useMeasurementMode";

// 2s on screen.
//
// The overlay outlives TOTAL_MS: onComplete clears `mode`, and only then does
// AnimatePresence play the exit. So the visible duration is
// TOTAL_MS + FADE_OUT_MS, i.e. FADE_IN + HOLD + 2 x FADE_OUT = 2000ms.
// Only the root carries an exit transition — AnimatePresence waits for the
// slowest exiting child, so children that linger would stretch this further.
const FADE_IN_MS = 280;
const HOLD_MS = 1080;
const FADE_OUT_MS = 320;

// Swap the underlying mode once the overlay is fully opaque, so the interface
// changes out of sight and the user never sees it flip. Anything earlier and
// the old UI visibly mutates behind a semi-transparent scrim.
const COMMIT_AT_MS = FADE_IN_MS + 100;
const TOTAL_MS = FADE_IN_MS + HOLD_MS + FADE_OUT_MS;

// Both modes share the kiosk's own theme primary - matches
// MeasurementModeToggle, so the pill just tapped and this overlay read as
// the same colour of system rather than two different ones.
const COPY = {
    [MEASUREMENT_MODES.SMART]: {
        label: "Smart Mode",
        caption: "Readings come from the kiosk sensors",
        icon: Cpu,
        accent: "var(--color-primary)",
    },
    [MEASUREMENT_MODES.MANUAL]: {
        label: "Manual Mode",
        caption: "Enter readings from an external device",
        icon: PencilLine,
        accent: "var(--color-primary)",
    },
};

const EASE = [0.22, 1, 0.36, 1];

/**
 * A line of type rising into place from behind a mask — the classic editorial
 * reveal. The clipping wrapper is what sells it; without the overflow hidden
 * it is just a slide.
 */
function MaskedLine({ children, delay = 0, className, style, reduce }) {
    return (
        <span className="block overflow-hidden">
            <motion.span
                className={`block ${className || ""}`}
                style={style}
                initial={reduce ? false : { y: "110%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 0.85, delay: reduce ? 0 : delay, ease: EASE }}
            >
                {children}
            </motion.span>
        </span>
    );
}

/**
 * Full-screen mode-change announcement.
 *
 * `mode` is the mode being switched *to*; pass null when idle. The component
 * owns its own timing and reports back twice: `onCommit` when the new mode
 * should be applied, and `onComplete` once the overlay has finished leaving.
 */
export default function MeasurementModeTransition({ mode, onCommit, onComplete }) {
    const shouldReduceMotion = useReducedMotion();

    // Held in refs so a parent re-render that produces new callback identities
    // cannot restart the timers midway through the animation.
    const onCommitRef = useRef(onCommit);
    const onCompleteRef = useRef(onComplete);
    onCommitRef.current = onCommit;
    onCompleteRef.current = onComplete;

    useEffect(() => {
        if (!mode) return undefined;

        if (shouldReduceMotion) {
            onCommitRef.current?.();
            const done = window.setTimeout(() => onCompleteRef.current?.(), 120);
            return () => window.clearTimeout(done);
        }

        const commit = window.setTimeout(() => onCommitRef.current?.(), COMMIT_AT_MS);
        const done = window.setTimeout(() => onCompleteRef.current?.(), TOTAL_MS);

        return () => {
            window.clearTimeout(commit);
            window.clearTimeout(done);
        };
    }, [mode, shouldReduceMotion]);

    const copy = mode ? COPY[mode] : null;
    const Icon = copy?.icon;
    const accent = copy?.accent;

    const overlay = (
        <AnimatePresence>
            {copy ? (
                <motion.div
                    key={mode}
                    className="fixed inset-0 z-[9500] flex items-center justify-center overflow-hidden px-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: shouldReduceMotion ? 0.01 : FADE_OUT_MS / 1000 } }}
                    transition={{ duration: shouldReduceMotion ? 0.01 : FADE_IN_MS / 1000, ease: "easeOut" }}
                    aria-live="polite"
                    style={{
                        // Near-opaque on purpose. At lower opacity the page
                        // behind competes with the type and the composition
                        // falls apart.
                        backgroundColor: "color-mix(in srgb, var(--color-bg) 97%, transparent)",
                        backdropFilter: "blur(24px)",
                        WebkitBackdropFilter: "blur(24px)",
                    }}
                >
                    {/* A single soft colour field, drifting up as it settles.
                        Warmth and depth without any hard edges.

                        Centred by a flex parent rather than -translate-x-1/2:
                        framer-motion writes its own inline `transform` for the
                        y/scale animation, which silently overrides Tailwind's
                        translate utilities and throws the field off-centre. */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <motion.div
                            aria-hidden="true"
                            className="h-[46rem] w-[46rem] max-w-none shrink-0 rounded-full"
                            style={{
                                background: `radial-gradient(circle, color-mix(in srgb, ${accent} 26%, transparent) 0%, transparent 62%)`,
                                filter: "blur(20px)",
                            }}
                            initial={{ opacity: 0, scale: 0.82, y: 26 }}
                            // Keeps drifting through the hold so the longer
                            // beat reads as calm rather than frozen.
                            animate={{ opacity: [0, 1, 1], scale: [0.82, 1, 1.06], y: [26, 0, -6] }}
                            transition={{ duration: 1.7, times: [0, 0.5, 1], ease: EASE }}
                        />
                    </div>

                    <div className="relative flex flex-col items-center text-center">
                        {/* Icon, held quietly above the type rather than
                            dominating it. */}
                        <motion.div
                            className="mb-9 flex h-16 w-16 items-center justify-center rounded-2xl"
                            style={{
                                backgroundColor: `color-mix(in srgb, ${accent} 13%, transparent)`,
                                color: accent,
                            }}
                            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.86, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.75, ease: EASE }}
                        >
                            {Icon ? <Icon size={28} strokeWidth={1.75} /> : null}
                        </motion.div>

                        {/* Kicker — the small editorial label that gives the
                            headline something to sit under. */}
                        <MaskedLine
                            delay={0.10}
                            reduce={shouldReduceMotion}
                            className="text-[0.7rem] font-black uppercase tracking-[0.42em]"
                            style={{ color: `color-mix(in srgb, ${accent} 85%, var(--color-muted))` }}
                        >
                            Measurement Mode
                        </MaskedLine>

                        <div className="mt-5">
                            {/* Uppercase and tight on purpose. The kicker above
                                is already small letterspaced caps; giving the
                                headline wide tracking too would flatten the
                                hierarchy into two competing lines. Contrast
                                comes from size and weight instead. */}
                            <MaskedLine
                                delay={0.22}
                                reduce={shouldReduceMotion}
                                className="text-4xl font-black uppercase leading-[1.05] tracking-[-0.015em] sm:text-6xl"
                                style={{ color: "var(--color-text)" }}
                            >
                                {copy.label}
                            </MaskedLine>
                        </div>

                        {/* Rule drawn out from the centre. */}
                        <motion.span
                            aria-hidden="true"
                            className="mt-8 block h-[2px] w-40 origin-center rounded-full"
                            style={{ backgroundColor: accent }}
                            initial={shouldReduceMotion ? false : { scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 1 }}
                            transition={{ duration: 0.9, delay: shouldReduceMotion ? 0 : 0.48, ease: EASE }}
                        />

                        <motion.p
                            className="mt-6 max-w-sm text-sm font-medium leading-6 sm:text-base"
                            style={{ color: "var(--color-muted)" }}
                            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: shouldReduceMotion ? 0 : 0.62, ease: EASE }}
                        >
                            {copy.caption}
                        </motion.p>
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );

    return createPortal(overlay, document.body);
}
