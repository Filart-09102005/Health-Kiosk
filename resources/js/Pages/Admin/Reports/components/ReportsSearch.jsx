import { Search } from "lucide-react";

export default function ReportsSearch({ value, onChange }) {
    return (
        <label className="flex min-w-0 flex-1 items-center gap-3 rounded-[1rem] border px-4 py-3" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <Search size={18} style={{ color: "var(--color-muted)" }} />
            <input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="Search reports, formats, roles, or status"
                className="w-full bg-transparent text-sm font-bold outline-none placeholder:font-bold"
                style={{ color: "var(--color-text)" }}
            />
        </label>
    );
}
