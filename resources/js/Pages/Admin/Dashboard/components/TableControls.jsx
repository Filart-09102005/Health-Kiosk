import { ChevronLeft, ChevronRight, Filter, Search } from "lucide-react";

export default function TableControls({ searchPlaceholder = "Search records..." }) {
    return (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative block w-full lg:max-w-xs">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-muted)" }} />
                <input
                    type="search"
                    placeholder={searchPlaceholder}
                    readOnly
                    className="h-10 w-full rounded-xl border pl-9 pr-3 text-sm font-semibold outline-none transition focus:ring-2"
                    style={{
                        backgroundColor: "var(--color-surface)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-text)",
                    }}
                />
            </label>
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    className="inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-black transition hk-soft-hover"
                    style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                >
                    <Filter size={14} />
                    Filter
                </button>
                <div
                    className="inline-flex items-center gap-1 rounded-xl border p-1"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                >
                    <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg transition hk-soft-hover" aria-label="Previous page">
                        <ChevronLeft size={16} />
                    </button>
                    <span className="px-2 text-xs font-black" style={{ color: "var(--color-muted)" }}>1 / 3</span>
                    <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg transition hk-soft-hover" aria-label="Next page">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
