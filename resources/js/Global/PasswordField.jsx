import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Eye, EyeOff, Lock } from "lucide-react";

/**
 * Password input with a show/hide toggle and an optional match/mismatch state
 * that traces a glowing outline around the field.
 *
 * Lifted out of ProfileDrawer so any screen needing a password box gets the
 * same behaviour. Fully controlled: the caller owns the value and the
 * visibility flag.
 *
 * @param validationState "match" | "mismatch" | anything else for the neutral look
 */
export default function PasswordField({ label, placeholder, value, show, onToggle, onChange, onBlur, error, validationState }) {
    const containerRef = useRef(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setContainerSize({
                    width: entry.target.clientWidth,
                    height: entry.target.clientHeight
                });
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const { width: w, height: h } = containerSize;
    const p = 2.5;
    const r = 12;

    const rightPath = w > 0 ? `M ${w/2} ${p} L ${w - r} ${p} Q ${w - p} ${p} ${w - p} ${r} L ${w - p} ${h - r} Q ${w - p} ${h - p} ${w - r} ${h - p} L ${r} ${h - p} Q ${p} ${h - p} ${p} ${h - r} L ${p} ${r} Q ${p} ${p} ${r} ${p} L ${w/2} ${p}` : "";
    const leftPath = w > 0 ? `M ${w/2} ${p} L ${r} ${p} Q ${p} ${p} ${p} ${r} L ${p} ${h - r} Q ${p} ${h - p} ${r} ${h - p} L ${w - r} ${h - p} Q ${w - p} ${h - p} ${w - p} ${h - r} L ${w - p} ${r} Q ${w - p} ${p} ${w - r} ${p} L ${w/2} ${p}` : "";

    const isMatched = validationState === "match";
    const isMismatch = validationState === "mismatch";
    const hasAnimation = isMatched || isMismatch;
    const activeColor = isMatched ? "#38BDF8" : "var(--color-error)";

    return (
        <label className="block text-left">
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black uppercase flex items-center gap-1.5" style={{ color: "var(--color-muted)" }}>{label}</span>
                <AnimatePresence mode="wait">
                    {isMatched ? (
                        <motion.span
                            key="match"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="text-xs font-black flex items-center gap-1"
                            style={{ color: activeColor }}
                        >
                            <Check size={14} /> Passwords match!
                        </motion.span>
                    ) : isMismatch ? (
                        <motion.span
                            key="mismatch"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="text-xs font-black flex items-center gap-1"
                            style={{ color: activeColor }}
                        >
                            Passwords do not match
                        </motion.span>
                    ) : null}
                </AnimatePresence>
            </div>
            <div
                ref={containerRef}
                className="mt-2 relative flex h-[3.25rem] items-center gap-3 rounded-xl border px-4 auth-control overflow-hidden"
                style={{
                    borderColor: hasAnimation ? "transparent" : error ? "var(--color-error)" : "var(--color-border)",
                    backgroundColor: hasAnimation ? `color-mix(in srgb, ${activeColor}, transparent 92%)` : "var(--color-surface)",
                    boxShadow: hasAnimation ? `0 12px 40px color-mix(in srgb, ${activeColor}, transparent 75%), 0 0 20px color-mix(in srgb, ${activeColor}, transparent 85%)` : "none",
                }}
            >
                <AnimatePresence mode="wait">
                    {hasAnimation && w > 0 && (
                        <svg key={activeColor} className="absolute inset-0 h-full w-full pointer-events-none z-20 overflow-visible" viewBox={`0 0 ${w} ${h}`}>
                            <motion.path
                                d={rightPath}
                                fill="none"
                                stroke={activeColor}
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ filter: `drop-shadow(0 0 8px ${activeColor}) drop-shadow(0 0 16px color-mix(in srgb, ${activeColor}, transparent 40%))` }}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                exit={{ opacity: 0, transition: { duration: 0.3 } }}
                                transition={{ duration: 4.5, ease: [0.16, 1, 0.3, 1] }}
                            />
                            <motion.path
                                d={leftPath}
                                fill="none"
                                stroke={activeColor}
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ filter: `drop-shadow(0 0 8px ${activeColor}) drop-shadow(0 0 16px color-mix(in srgb, ${activeColor}, transparent 40%))` }}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                exit={{ opacity: 0, transition: { duration: 0.3 } }}
                                transition={{ duration: 4.5, ease: [0.16, 1, 0.3, 1] }}
                            />
                        </svg>
                    )}
                </AnimatePresence>

                <Lock size={17} className="z-30" style={{ color: hasAnimation ? activeColor : "var(--color-muted)" }} />
                <input
                    type={show ? "text" : "password"}
                    value={value}
                    placeholder={placeholder || `Enter ${label.toLowerCase()}`}
                    onChange={(event) => onChange(event.target.value)}
                    onBlur={onBlur}
                    className="w-full bg-transparent text-sm font-semibold outline-none placeholder:opacity-50 z-30 relative"
                    style={{ color: "var(--color-text)" }}
                    autoComplete="new-password"
                />
                <button type="button" onClick={onToggle} className="rounded-lg p-1 transition hover:scale-105 z-30" style={{ color: "var(--color-muted)" }}>
                    {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
            </div>
            {error && !hasAnimation ? <span className="mt-1 block text-xs" style={{ color: "var(--color-error)" }}>{error[0]}</span> : null}
        </label>
    );
}
