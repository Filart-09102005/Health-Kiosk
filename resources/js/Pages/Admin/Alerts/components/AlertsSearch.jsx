import { Search } from "lucide-react";

export default function AlertsSearch({ value, onChange }) {
    return (
        <label className="flex h-11 min-w-[240px] flex-1 items-center gap-2 rounded-[12px] border px-3" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <Search size={17} style={{ color: "var(--color-muted)" }} />
            <input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="Search alert ID, school ID, name, severity..."
                className="w-full bg-transparent text-sm font-bold outline-none placeholder:font-bold"
                style={{ color: "var(--color-text)" }}
            />
        </label>
    );
}
