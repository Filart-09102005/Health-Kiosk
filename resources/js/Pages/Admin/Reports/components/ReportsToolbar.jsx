import { RefreshCw } from "lucide-react";
import GenerateReportButton from "./GenerateReportButton";
import ReportsFilters from "./ReportsFilters";

export default function ReportsToolbar({ range, filters, filterOptions, onRangeChange, onFilterChange, onSetArrayFilter, onGenerate, onRefresh }) {
    return (
        <section className="rounded-[14px] border p-4 shadow-xl" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center">
                <ReportsFilters
                    range={range}
                    filters={filters}
                    options={filterOptions}
                    onRangeChange={onRangeChange}
                    onFilterChange={onFilterChange}
                    onSetArrayFilter={onSetArrayFilter}
                />
                <div className="flex shrink-0 flex-wrap items-center gap-3">
                    <GenerateReportButton onClick={onGenerate} />
                    <button
                        type="button"
                        onClick={onRefresh}
                        className="flex h-12 w-12 items-center justify-center rounded-[12px] border transition hk-admin-nav-hover"
                        style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                        title="Clear generated report"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>
        </section>
    );
}
