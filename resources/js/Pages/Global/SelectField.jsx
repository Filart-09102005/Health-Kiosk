import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Tooltip from "./Tooltip";

/**
 * @param disabled  Unavailable: dimmed to 50% and not interactive.
 * @param readOnly  View mode: fully legible, just not interactive. Use this
 *                  when the value matters to the reader but editing is off —
 *                  `disabled` fades the text too much to read comfortably.
 */
export default function SelectField({ label, value, onChange, error, options, disabled, readOnly, helper, tooltip }) {
    const locked = disabled || readOnly;
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState("bottom");
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return undefined;

        const updatePlacement = () => {
            if (!dropdownRef.current) return;
            const rect = dropdownRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;

            setDropdownPosition((currentPosition) => {
                if (currentPosition === "bottom") {
                    if (spaceBelow < 180 && spaceAbove > 200) {
                        return "top";
                    }
                } else if (currentPosition === "top") {
                    if (spaceBelow > 300) {
                        return "bottom";
                    }
                }
                return currentPosition;
            });
        };

        updatePlacement();
        window.addEventListener("scroll", updatePlacement, true);
        window.addEventListener("resize", updatePlacement);

        return () => {
            window.removeEventListener("scroll", updatePlacement, true);
            window.removeEventListener("resize", updatePlacement);
        };
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (event) => {
            if (event.key === "Escape") setIsOpen(false);
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    const selectedOption = options.find((opt) => opt[0] === value) || options[0];
    const isTop = dropdownPosition === "top";

    return (
        <div className="block text-left" ref={dropdownRef}>
            <span className="text-sm font-black auth-strong-text flex items-center justify-between">
                <span className="flex items-center">
                    {label}
                    {tooltip && <Tooltip text={tooltip} />}
                </span>
                {error && (
                    <span className="text-xs font-bold flex items-center gap-1" style={{ color: "var(--color-error)" }}>
                        {error}
                    </span>
                )}
            </span>

            <div className="relative mt-2">
                <button
                    type="button"
                    disabled={locked}
                    aria-readonly={readOnly ? "true" : undefined}
                    onClick={() => !locked && setIsOpen(!isOpen)}
                    className={`h-[3.25rem] w-full flex items-center justify-between rounded-xl border px-4 text-sm font-bold uppercase outline-none transition auth-control ${
                        disabled ? "opacity-50 cursor-not-allowed" : readOnly ? "cursor-default" : "hover:-translate-y-0.5 cursor-pointer"
                    }`}
                    style={{
                        borderColor: error ? "var(--color-error)" : undefined,
                        color: value ? "var(--auth-text)" : "var(--color-muted)",
                    }}
                >
                    <span className="truncate">{selectedOption ? selectedOption[1] : "Select option"}</span>
                    {/* No chevron in read-only mode — there is nothing to open,
                        and the arrow would advertise an interaction that isn't there. */}
                    {readOnly ? null : (
                        <span
                            className="flex items-center justify-center transition-transform duration-300 text-muted-foreground"
                            style={{
                                color: "var(--auth-muted)",
                                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                            }}
                        >
                            <ChevronDown size={18} strokeWidth={1.5} />
                        </span>
                    )}
                </button>

                <AnimatePresence>
                    {isOpen && !locked && (
                        <motion.div
                            initial={{ opacity: 0, y: isTop ? 8 : -8, scale: 0.98 }}
                            animate={{ opacity: 1, y: isTop ? -4 : 4, scale: 1 }}
                            exit={{ opacity: 0, y: isTop ? 8 : -8, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className={`absolute left-0 right-0 z-50 rounded-2xl border p-1 shadow-2xl overflow-hidden auth-panel ${
                                isTop ? "bottom-full mb-2" : "top-full mt-2"
                            }`}
                            style={{
                                borderColor: "var(--color-border)",
                                backgroundColor: "var(--color-card)",
                                backdropFilter: "blur(12px)",
                            }}
                        >
                            <div className="max-h-60 overflow-y-auto hk-no-scrollbar space-y-1 p-1.5">
                                {options.map(([optionValue, optionLabel], idx) => {
                                    if (idx === 0) return null;
                                    const isSelected = value === optionValue;

                                    return (
                                        <button
                                            key={optionValue}
                                            type="button"
                                            onClick={() => {
                                                onChange(optionValue);
                                                setIsOpen(false);
                                            }}
                                            className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-black uppercase rounded-xl transition-all text-left ${
                                                isSelected ? "hk-flow-action-hint" : "hk-soft-hover"
                                            }`}
                                            style={{
                                                backgroundColor: isSelected
                                                    ? "color-mix(in srgb, var(--color-primary) 14%, var(--color-surface))"
                                                    : "transparent",
                                                color: isSelected ? "var(--color-primary)" : "var(--color-text)",
                                            }}
                                        >
                                            <span className="truncate">{optionLabel}</span>
                                            {isSelected && <Check size={14} style={{ color: "var(--color-primary)" }} />}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            {helper && !error ? (
                <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>{helper}</p>
            ) : null}
        </div>
    );
}
