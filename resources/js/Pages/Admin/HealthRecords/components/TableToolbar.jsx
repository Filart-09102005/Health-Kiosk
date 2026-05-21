import { RefreshCw } from "lucide-react";
import ExportButton from "./ExportButton";
import RecordsSearch from "./RecordsSearch";

export default function TableToolbar({ search, onSearchChange, isSearching, onRefresh, activeFilterCount = 0 }) {
    return (
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="w-full xl:max-w-xl">
                <RecordsSearch value={search} onChange={onSearchChange} isSearching={isSearching} />
            </div>
            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                {activeFilterCount > 0 ? (
                    <span className="rounded-full px-2.5 py-1 text-[0.65rem] font-black" style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, transparent)", color: "var(--color-primary)" }}>
                        {activeFilterCount} active filter{activeFilterCount > 1 ? "s" : ""}
                    </span>
                ) : null}
                <button
                    type="button"
                    onClick={onRefresh}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-xs font-black transition hk-soft-hover"
                    style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                >
                    <RefreshCw size={14} />
                    Refresh
                </button>
                <ExportButton label="Export records" />
            </div>
        </div>
    );
}
