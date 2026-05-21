import { Search } from "lucide-react";

export default function AnalyticsSearch({ value, onChange, isSearching }) {
    return (
        <label className="relative block w-full lg:max-w-sm">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-muted)" }} />
            <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Search metrics, alerts, modules..." className="h-10 w-full rounded-xl border pl-9 pr-10 text-sm font-semibold outline-none" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }} />
            {isSearching ? <span className="absolute right-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} /> : null}
        </label>
    );
}
