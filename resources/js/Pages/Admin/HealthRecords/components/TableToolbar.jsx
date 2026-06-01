import { FileSpreadsheet, FileText, Printer, RefreshCw } from "lucide-react";
import { exportToExcel, exportToPdf, printRecords } from "../utils/exportRecords";
import RecordsSearch from "./RecordsSearch";

export default function TableToolbar({
    search,
    onSearchChange,
    isSearching,
    onRefresh,
    activeFilterCount = 0,
    filteredRecords = [],
}) {
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
                <button
                    type="button"
                    onClick={() => exportToExcel(filteredRecords)}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-xs font-black transition hk-soft-hover text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                    style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                    title="Export all filtered records to Excel spreadsheet"
                >
                    <FileSpreadsheet size={14} className="text-emerald-600" />
                    Excel
                </button>
                <button
                    type="button"
                    onClick={() => exportToPdf(filteredRecords)}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-xs font-black transition hk-soft-hover text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                    style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                    title="Export all filtered records to PDF report"
                >
                    <FileText size={14} className="text-rose-600" />
                    PDF
                </button>
                <button
                    type="button"
                    onClick={() => printRecords(filteredRecords)}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-xs font-black transition hk-soft-hover text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                    style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                    title="Print out structured clinic health records report"
                >
                    <Printer size={14} className="text-blue-600" />
                    Print
                </button>
            </div>
        </div>
    );
}
