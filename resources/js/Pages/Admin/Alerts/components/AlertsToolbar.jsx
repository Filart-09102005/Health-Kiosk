import AlertsSearch from "./AlertsSearch";
import AlertsFilters from "./AlertsFilters";

export default function AlertsToolbar({ search, onSearch, filters, onFilterChange, severityOptions, measurementOptions }) {
    return (
        <section className="rounded-[14px] border p-4 shadow-sm" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <AlertsSearch value={search} onChange={onSearch} />
                <div className="flex flex-wrap items-end gap-2">
                    <AlertsFilters 
                        filters={filters} 
                        onFilterChange={onFilterChange} 
                        severityOptions={severityOptions}
                        measurementOptions={measurementOptions}
                    />
                </div>
            </div>
        </section>
    );
}
