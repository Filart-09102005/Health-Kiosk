import { motion, useReducedMotion } from "framer-motion";
import { Cpu, PencilLine } from "lucide-react";
import { MEASUREMENT_MODES } from "../hooks/useMeasurementMode";

// Both modes share one accent - the active theme's primary - so the toggle
// reads as "which mode" rather than mixing in a second, unrelated hue.
// Matches MeasurementModeTransition so the pill the user just tapped and the
// overlay that follows read as the same colour of system.
const OPTIONS = [
    {
        mode: MEASUREMENT_MODES.SMART,
        label: "Smart Mode",
        hint: "Read automatically from kiosk sensors",
        icon: Cpu,
        accent: "var(--color-primary)",
        accentContent: "var(--color-primary-content)",
    },
    {
        mode: MEASUREMENT_MODES.MANUAL,
        label: "Manual Mode",
        hint: "Enter values from an external device",
        icon: PencilLine,
        accent: "var(--color-primary)",
        accentContent: "var(--color-primary-content)",
    },
];

export default function MeasurementModeToggle({ mode, onChange, disabled = false }) {
    const shouldReduceMotion = useReducedMotion();
    const active = OPTIONS.find((option) => option.mode === mode) || OPTIONS[0];

    return (
        <div
            className="flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border p-4 sm:p-5"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
            <div className="min-w-0">
                <p
                    className="text-[10px] font-black uppercase tracking-[0.18em]"
                    style={{ color: "var(--color-muted)" }}
                >
                    Measurement Mode
                </p>
                <p className="mt-1 text-sm font-semibold leading-5" style={{ color: "var(--color-muted)" }}>
                    {active.hint}
                </p>
            </div>

            <div
                role="radiogroup"
                aria-label="Measurement mode"
                className="flex shrink-0 gap-1 rounded-2xl border p-1"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
            >
                {OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isActive = option.mode === active.mode;

                    return (
                        <button
                            key={option.mode}
                            type="button"
                            role="radio"
                            aria-checked={isActive}
                            disabled={disabled}
                            onClick={() => onChange?.(option.mode)}
                            className="relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50"
                            style={{ color: isActive ? active.accentContent : "var(--color-muted)" }}
                        >
                            {isActive && (
                                <motion.span
                                    layoutId="measurement-mode-pill"
                                    transition={
                                        shouldReduceMotion
                                            ? { duration: 0.01 }
                                            : { type: "spring", stiffness: 420, damping: 34 }
                                    }
                                    className="absolute inset-0 rounded-xl"
                                    style={{
                                        backgroundColor: active.accent,
                                        boxShadow: `0 6px 18px -6px color-mix(in srgb, ${active.accent} 85%, transparent)`,
                                    }}
                                />
                            )}
                            {/* Sits above the sliding pill so the label stays legible mid-animation. */}
                            <span className="relative z-10 flex items-center gap-2">
                                <Icon size={16} />
                                {option.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
