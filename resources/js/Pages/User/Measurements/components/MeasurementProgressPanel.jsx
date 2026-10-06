import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * The Reading step's progress display.
 *
 * Presentation only — every value it shows comes from useMeasurementProgress,
 * which in turn only moves when the sensor reports something real.
 */
export default function MeasurementProgressPanel({
    progress,
    label,
    hint,
    icon: Icon,
    accent,
    indeterminate,
    waiting,
    lost,
    countingDown,
}) {
    const shouldReduceMotion = useReducedMotion();
    const shown = useCountUp(progress, shouldReduceMotion);

    // Three distinct tones, not two: grey while nothing has been detected yet,
    // a lighter grey once detected but still just counting down (nothing is
    // actually being read yet), and only the sensor's own accent colour once
    // real collection is under way — a coloured bar during the countdown
    // reads as "already loading" when nothing has started.
    const barColor = lost
        ? "var(--color-warning)"
        : waiting
            ? "color-mix(in srgb, var(--color-muted) 45%, transparent)"
            : countingDown
                ? "color-mix(in srgb, var(--color-muted) 22%, transparent)"
                : accent;

    return (
        <div className="mx-auto w-full max-w-xl">
            <div className="flex items-end justify-between gap-4">
                <div className="flex min-w-0 items-center gap-2.5">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                            key={label}
                            initial={shouldReduceMotion ? false : { opacity: 0, y: 6, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6, scale: 0.9 }}
                            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                            style={{
                                backgroundColor: `color-mix(in srgb, ${barColor} 14%, transparent)`,
                                color: barColor,
                            }}
                        >
                            {Icon ? (
                                <Icon
                                    className={`h-4 w-4 ${indeterminate && !shouldReduceMotion ? "animate-pulse" : ""}`}
                                />
                            ) : null}
                        </motion.span>
                    </AnimatePresence>

                    {/* Stage text crossfades rather than swapping, so a change
                        of stage reads as a transition and not a glitch. */}
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.p
                            key={label}
                            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
                            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                            className="truncate text-left text-sm font-black tracking-tight"
                            style={{ color: "var(--color-text)" }}
                        >
                            {label}
                        </motion.p>
                    </AnimatePresence>
                </div>

                <span
                    className="shrink-0 text-2xl font-black tabular-nums tracking-tighter"
                    style={{ color: barColor }}
                >
                    {Math.round(shown)}
                    <span className="ml-0.5 text-sm font-bold" style={{ color: "var(--color-muted)" }}>%</span>
                </span>
            </div>

            <div
                className="relative mt-3 h-2.5 w-full overflow-hidden rounded-full"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
                aria-valuetext={`${Math.round(progress)}% — ${label}`}
                style={{ backgroundColor: "var(--color-border)" }}
            >
                <motion.div
                    className="relative h-full rounded-full"
                    animate={{ width: `${progress}%` }}
                    transition={
                        shouldReduceMotion
                            ? { duration: 0.01 }
                            // Slow and soft: the bar should look like it is
                            // settling into place, never snapping.
                            : { type: "spring", stiffness: 90, damping: 24, mass: 0.6 }
                    }
                    style={{
                        background: `linear-gradient(90deg, color-mix(in srgb, ${barColor} 72%, transparent), ${barColor})`,
                        boxShadow: waiting ? "none" : `0 0 14px -2px color-mix(in srgb, ${barColor} 70%, transparent)`,
                    }}
                >
                    {indeterminate && !shouldReduceMotion && (
                        <motion.span
                            aria-hidden="true"
                            className="absolute inset-y-0 w-1/3"
                            style={{
                                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)",
                            }}
                            animate={{ x: ["-120%", "320%"] }}
                            transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
                        />
                    )}
                </motion.div>
            </div>

            {/* Only present while the system needs something from the person —
                it disappears the moment the reading is actually progressing. */}
            <AnimatePresence initial={false}>
                {hint ? (
                    <motion.p
                        key={hint}
                        initial={shouldReduceMotion ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={shouldReduceMotion ? undefined : { opacity: 0, height: 0 }}
                        transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden text-center text-sm font-semibold leading-6"
                        style={{ color: lost ? "var(--color-warning)" : "var(--color-muted)" }}
                    >
                        <span className="mt-3 inline-block">{hint}</span>
                    </motion.p>
                ) : null}
            </AnimatePresence>
        </div>
    );
}

/**
 * Eases the displayed number toward the real one.
 *
 * The bar itself is spring-animated by framer-motion, but the percentage is
 * text — without this it would jump in whole numbers a frame ahead of the bar
 * and the two would visibly disagree.
 */
function useCountUp(target, immediate) {
    const [value, setValue] = useState(target);
    const raf = useRef(null);

    useEffect(() => {
        if (immediate) {
            setValue(target);
            return undefined;
        }

        const tick = () => {
            let settled = false;

            setValue((current) => {
                const delta = target - current;
                if (Math.abs(delta) < 0.35) {
                    settled = true;
                    return target;
                }
                return current + delta * 0.12;
            });

            // Stop once we have caught up, rather than spinning a rAF loop for
            // the whole life of the screen.
            if (!settled) raf.current = requestAnimationFrame(tick);
        };

        raf.current = requestAnimationFrame(tick);
        return () => {
            if (raf.current) cancelAnimationFrame(raf.current);
        };
    }, [target, immediate]);

    return value;
}
