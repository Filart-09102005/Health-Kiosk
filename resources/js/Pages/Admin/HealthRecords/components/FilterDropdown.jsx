import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FilterDropdown({ label, value, options, onChange, active = false }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find((opt) => opt.value === value) || options[0];

    return (
        <div className="relative min-w-0 text-left" ref={dropdownRef}>
            <span className="mb-1 block text-[0.65rem] font-black uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
                {label}
            </span>
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex h-11 w-full items-center justify-between rounded-[12px] border px-3 text-sm font-bold outline-none transition"
                    style={{
                        backgroundColor: active ? "color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))" : "var(--color-surface)",
                        borderColor: active ? "color-mix(in srgb, var(--color-primary) 30%, var(--color-border))" : "var(--color-border)",
                        color: "var(--color-text)",
                    }}
                >
                    <span className="truncate text-xs font-black">{selectedOption.label}</span>
                    <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-transform duration-300"
                        style={{
                            backgroundColor: "color-mix(in srgb, var(--color-text) 5%, transparent)",
                            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        }}
                    >
                        <ChevronDown size={14} style={{ color: "var(--color-muted)" }} />
                    </span>
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 top-full z-50 mt-2 w-full min-w-[200px] overflow-hidden rounded-[14px] border p-1.5 shadow-xl backdrop-blur-md"
                            style={{ 
                                borderColor: "var(--color-border)", 
                                backgroundColor: "color-mix(in srgb, var(--color-bg) 95%, transparent)",
                            }}
                        >
                            <div className="max-h-60 overflow-y-auto space-y-0.5 hk-sidebar-scroll">
                                {options.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                        }}
                                        className={`flex w-full items-center rounded-[10px] px-3 py-2.5 text-left text-xs font-black transition-colors ${value === option.value ? '' : 'hover:opacity-75'}`}
                                        style={{
                                            backgroundColor: value === option.value ? "var(--color-primary)" : "transparent",
                                            color: value === option.value ? "var(--color-bg)" : "var(--color-text)",
                                        }}
                                    >
                                        <span className="flex-1">{option.label}</span>
                                        {value === option.value && <Check size={14} />}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

