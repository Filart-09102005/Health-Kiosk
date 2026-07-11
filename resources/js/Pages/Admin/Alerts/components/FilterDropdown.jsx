import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function FilterDropdown({ label, value, options, onChange, active = false }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;

        const handlePointerDown = (event) => {
            if (!rootRef.current?.contains(event.target)) {
                setOpen(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setOpen(false);
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    const handleSelect = (nextValue) => {
        onChange(nextValue);
        setOpen(false);
    };

    const displayValue = options.find((opt) => opt.value === value)?.label || "All";

    return (
        <div ref={rootRef} className="relative min-w-0">
            <span className="mb-1 block text-[0.65rem] font-black uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
                {label}
            </span>
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                className="flex h-11 w-full items-center justify-between gap-3 rounded-[12px] border pl-3 pr-4 text-left text-sm font-black transition"
                style={{
                    backgroundColor: active ? "color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))" : "var(--color-surface)",
                    borderColor: active ? "color-mix(in srgb, var(--color-primary) 30%, var(--color-border))" : "var(--color-border)",
                    color: "var(--color-text)",
                }}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className="min-w-0 truncate">{displayValue}</span>
                <ChevronDown
                    size={17}
                    className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                    style={{ color: "var(--color-muted)" }}
                />
            </button>

            {open ? (
                <div
                    className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-[14px] border p-1 shadow-xl"
                    style={{
                        backgroundColor: "var(--color-card)",
                        borderColor: "var(--color-border)",
                        boxShadow: "0 18px 50px rgba(0, 0, 0, 0.18)",
                    }}
                    role="listbox"
                >
                    <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto pr-1">
                        {options.map((option) => {
                            const isActive = option.value === value;

                            return (
                                <button
                                    key={option.value || "all"}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className="flex min-h-10 w-full items-center justify-between gap-3 rounded-[10px] px-3 py-2 text-left text-sm font-black transition hk-admin-nav-hover"
                                    style={{
                                        backgroundColor: isActive ? "color-mix(in srgb, var(--color-primary) 12%, transparent)" : "transparent",
                                        color: isActive ? "var(--color-primary)" : "var(--color-text)",
                                    }}
                                    role="option"
                                    aria-selected={isActive}
                                >
                                    <span className="min-w-0 truncate">{option.label}</span>
                                    {isActive ? <Check size={15} className="shrink-0" /> : <span className="h-[15px] w-[15px] shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
