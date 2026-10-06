import { RotateCcw } from "lucide-react";
import GenerateReportButton from "./GenerateReportButton";
import ReportsFilters from "./ReportsFilters";

export default function ReportsToolbar({ range, filters, filterOptions, onRangeChange, onFilterChange, onSetArrayFilter, onGenerate, onRefresh }) {
    return (
        <section
            className="rounded-3xl border p-5 shadow-2xl space-y-4"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
            <ReportsFilters
                range={range}
                filters={filters}
                options={filterOptions}
                onRangeChange={onRangeChange}
                onFilterChange={onFilterChange}
                onSetArrayFilter={onSetArrayFilter}
            />

            <div className="flex items-center justify-end gap-3 pt-2 border-t" style={{ borderColor: "var(--color-border)" }}>
                <button
                    type="button"
                    onClick={onRefresh}
                    className="flex h-11 items-center gap-2 rounded-2xl border px-4 text-xs font-black transition-all hk-soft-hover"
                    style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-muted)" }}
                    title="Clear generated report"
                >
                    <RotateCcw size={14} />
                    <span>Reset</span>
                </button>

                <GenerateReportButton onClick={onGenerate} />
            </div>
        </section>
    );
}
