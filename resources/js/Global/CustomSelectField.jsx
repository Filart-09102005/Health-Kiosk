import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Check, AlertCircle } from "lucide-react";

export default function CustomSelectField({
    label,
    value,
    onChange,
    options = [],
    placeholder = "Select an option",
    error,
    disabled = false,
    helper,
    className = "",
}) {
    const [open, setOpen] = useState(false);
    const [placement, setPlacement] = useState("bottom");
    const containerRef = useRef(null);

    // Normalize options array into [{ value, label, badge }]
    const normalizedOptions = options.map((opt) => {
        if (typeof opt === "object" && opt !== null) {
            return {
                value: opt.value ?? opt.id ?? "",
                label: opt.label ?? opt.name ?? String(opt.value),
                badge: opt.badge,
            };
        }
        return {
            value: String(opt),
            label: String(opt),
            badge: undefined,
        };
    });

    const selectedOption = normalizedOptions.find(
        (opt) => String(opt.value).toLowerCase() === String(value).toLowerCase()
    );

    useEffect(() => {
        if (!open) return undefined;

        const updatePlacement = () => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const dropdownHeight = 260; // Max height of dropdown (~max-h-64)

            setPlacement((currentPlacement) => {
                if (currentPlacement === "bottom") {
                    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
                        return "top";
                    }
                } else if (currentPlacement === "top") {
                    if (spaceAbove < dropdownHeight && spaceBelow > spaceAbove) {
                        return "bottom";
                    }
                }
                return currentPlacement;
            });
        };

        updatePlacement();
        window.addEventListener("scroll", updatePlacement, true);
        window.addEventListener("resize", updatePlacement);

        return () => {
            window.removeEventListener("scroll", updatePlacement, true);
            window.removeEventListener("resize", updatePlacement);
        };
    }, [open]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };

        const handleKeyDown = (e) => {
            if (e.key === "Escape") setOpen(false);
        };

        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    const isTop = placement === "top";

    return (
        <div className={`relative w-full text-left space-y-1.5 ${className}`} ref={containerRef}>
            {label && (
                <label className="text-xs font-black tracking-wide flex items-center justify-between" style={{ color: "var(--color-muted)" }}>
                    <span>{label}</span>
                    {error && (
                        <span className="flex items-center gap-1 text-[11px] font-bold" style={{ color: "var(--color-error)" }}>
                            <AlertCircle size={12} />
                            {error}
                        </span>
                    )}
                </label>
            )}

            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((prev) => !prev)}
                className={`w-full h-12 flex items-center justify-between gap-3 rounded-2xl border px-4 py-2 text-sm font-black transition shadow-sm outline-none ${
                    disabled ? "opacity-50 cursor-not-allowed" : "hk-soft-hover cursor-pointer"
                }`}
                style={{
                    backgroundColor: "var(--color-card)",
                    borderColor: error ? "var(--color-error)" : "var(--color-border)",
                    color: selectedOption ? "var(--color-text)" : "var(--color-muted)",
                }}
            >
                <div className="flex items-center gap-2 truncate">
                    {selectedOption?.badge && (
                        <span
                            className="rounded-md px-2 py-0.5 text-[0.68rem] font-black uppercase border shrink-0"
                            style={{
                                backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, var(--color-surface))",
                                borderColor: "color-mix(in srgb, var(--color-primary) 30%, transparent)",
                                color: "var(--color-primary)",
                            }}
                        >
                            {selectedOption.badge}
                        </span>
                    )}
                    <span className="truncate">
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>

                <ChevronDown
                    size={16}
                    className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                    style={{ color: "var(--color-muted)" }}
                />
            </button>

            {helper && !error && (
                <p className="text-[11px] font-bold" style={{ color: "var(--color-muted)" }}>
                    {helper}
                </p>
            )}

            <AnimatePresence>
                {open && !disabled && (
                    <motion.div
                        initial={{ opacity: 0, y: isTop ? 6 : -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: isTop ? -4 : 4, scale: 1 }}
                        exit={{ opacity: 0, y: isTop ? 6 : -6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute right-0 left-0 z-[9600] max-h-64 overflow-y-auto hk-no-scrollbar rounded-2xl border p-2 shadow-2xl space-y-1 ${
                            isTop ? "bottom-full mb-2" : "top-full mt-1.5"
                        }`}
                        style={{
                            backgroundColor: "var(--color-card)",
                            borderColor: "var(--color-border)",
                        }}
                    >
                        {normalizedOptions.length === 0 ? (
                            <div className="p-3 text-center text-xs font-bold" style={{ color: "var(--color-muted)" }}>
                                No options available
                            </div>
                        ) : (
                            normalizedOptions.map((opt) => {
                                const isSelected = String(opt.value).toLowerCase() === String(value).toLowerCase();

                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                            onChange(opt.value);
                                            setOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-xs font-black text-left transition ${
                                            isSelected ? "hk-flow-action-hint" : "hk-soft-hover"
                                        }`}
                                        style={{
                                            backgroundColor: isSelected
                                                ? "color-mix(in srgb, var(--color-primary) 14%, var(--color-surface))"
                                                : "transparent",
                                            color: isSelected ? "var(--color-primary)" : "var(--color-text)",
                                        }}
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            {opt.badge && (
                                                <span
                                                    className="rounded px-1.5 py-0.5 text-[9px] font-black uppercase border shrink-0"
                                                    style={{
                                                        backgroundColor: "var(--color-surface)",
                                                        borderColor: "var(--color-border)",
                                                        color: isSelected ? "var(--color-primary)" : "var(--color-muted)",
                                                    }}
                                                >
                                                    {opt.badge}
                                                </span>
                                            )}
                                            <span className="truncate">{opt.label}</span>
                                        </div>
                                        {isSelected && <Check size={14} style={{ color: "var(--color-primary)" }} />}
                                    </button>
                                );
                            })
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
