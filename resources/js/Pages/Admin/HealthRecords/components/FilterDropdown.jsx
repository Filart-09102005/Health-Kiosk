import { ChevronDown } from "lucide-react";

export default function FilterDropdown({ label, value, options, onChange, active = false }) {
    return (
        <label className="relative min-w-0">
            <span className="mb-1 block text-[0.65rem] font-black uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
                {label}
            </span>
            <div className="relative">
                <select
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="h-11 w-full appearance-none rounded-xl border py-0 pl-3 pr-8 text-xs font-black outline-none transition"
                    style={{
                        backgroundColor: active ? "color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))" : "var(--color-surface)",
                        borderColor: active ? "color-mix(in srgb, var(--color-primary) 30%, var(--color-border))" : "var(--color-border)",
                        color: "var(--color-text)",
                    }}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--color-muted)" }} />
            </div>
        </label>
    );
}
