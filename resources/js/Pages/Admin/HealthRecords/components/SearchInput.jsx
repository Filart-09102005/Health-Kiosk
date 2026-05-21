import { Search } from "lucide-react";

export default function SearchInput({ value, onChange, placeholder = "Search...", isSearching = false }) {
    return (
        <label className="relative block w-full">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-muted)" }} />
            <input
                type="search"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="h-11 w-full rounded-xl border pl-9 pr-10 text-sm font-semibold outline-none transition focus:ring-2"
                style={{
                    backgroundColor: "var(--color-surface)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text)",
                }}
            />
            {isSearching ? <span className="absolute right-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} /> : null}
        </label>
    );
}
