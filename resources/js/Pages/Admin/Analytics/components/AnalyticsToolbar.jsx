import { RefreshCw } from "lucide-react";
import AnalyticsSearch from "./AnalyticsSearch";
import ExportAnalyticsButton from "./ExportAnalyticsButton";

export default function AnalyticsToolbar({ search, onSearchChange, isSearching, onRefresh, activeFilterCount }) {
    return (
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <AnalyticsSearch value={search} onChange={onSearchChange} isSearching={isSearching} />
            <div className="flex flex-wrap items-center gap-2">
                {activeFilterCount > 0 ? <span className="rounded-full px-2.5 py-1 text-[0.65rem] font-black" style={{ color: "var(--color-primary)", backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, transparent)" }}>{activeFilterCount} active</span> : null}
                <button type="button" onClick={onRefresh} className="inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-black transition hk-soft-hover" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}><RefreshCw size={14} />Refresh</button>
                <ExportAnalyticsButton />
            </div>
        </div>
    );
}
