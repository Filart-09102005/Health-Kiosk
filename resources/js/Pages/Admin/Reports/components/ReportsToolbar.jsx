import { RefreshCw } from "lucide-react";
import ExportExcelButton from "./ExportExcelButton";
import ExportPDFButton from "./ExportPDFButton";
import GenerateReportButton from "./GenerateReportButton";
import ReportsFilters from "./ReportsFilters";
import ReportsSearch from "./ReportsSearch";

export default function ReportsToolbar({ search, onSearch }) {
    return (
        <section className="rounded-[14px] border p-4 shadow-xl" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                <ReportsSearch value={search} onChange={onSearch} />
                <ReportsFilters />
                <div className="flex flex-wrap items-center gap-3">
                    <ExportPDFButton />
                    <ExportExcelButton />
                    <GenerateReportButton />
                    <button className="flex h-12 w-12 items-center justify-center rounded-[12px] border transition hk-admin-nav-hover" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
                {["Date: This month", "Role: All", "Status: All", "Format: PDF"].map((filter) => (
                    <span key={filter} className="rounded-full border px-3 py-1 text-xs font-black" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>{filter}</span>
                ))}
            </div>
        </section>
    );
}
