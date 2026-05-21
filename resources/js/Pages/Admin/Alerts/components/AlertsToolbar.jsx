import { RefreshCw } from "lucide-react";
import AlertsSearch from "./AlertsSearch";
import AlertsFilters from "./AlertsFilters";
import ExportAlertsButton from "./ExportAlertsButton";

export default function AlertsToolbar({ search, onSearch }) {
    return (
        <section className="rounded-[14px] border p-4 shadow-sm" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <AlertsSearch value={search} onChange={onSearch} />
                <div className="flex flex-wrap items-center gap-2">
                    <AlertsFilters />
                    <ExportAlertsButton />
                    <button className="flex h-11 items-center gap-2 rounded-[12px] border px-3 text-sm font-black transition hk-admin-nav-hover" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                        <RefreshCw size={17} />
                        Refresh
                    </button>
                </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
                {["Critical visible", "Pending review", "Today"].map((filter) => (
                    <span key={filter} className="rounded-full border px-3 py-1 text-xs font-black" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>{filter}</span>
                ))}
            </div>
        </section>
    );
}
