import { motion, useReducedMotion } from "framer-motion";
import { FileSpreadsheet, FileText } from "lucide-react";
import { exportToExcel, exportToPdf } from "../utils/exportRecords";
import { cardClassName, cardStyle } from "../utils/surface";
import Pagination from "./Pagination";
import RecordTableRow from "./RecordTableRow";

const columns = [
    "School ID",
    "Full Name",
    "Role",
    "Temp",
    "HR",
    "SpO2",
    "Height",
    "Weight",
    "BMI",
    "Health",
    "Session",
    "Recorded",
    "Actions",
];

export default function RecordsTable({ records, page, totalPages, onPageChange, onViewDetails, totalLabel, exportRecords = records }) {
    const shouldReduceMotion = useReducedMotion();

    return (
        <motion.article
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldReduceMotion ? { duration: 0.01 } : { delay: 1.2, duration: 0.34, ease: "easeOut" }}
            className={`${cardClassName} overflow-hidden p-5`}
            style={cardStyle}
        >
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h3 className="text-sm font-black">Health records table</h3>
                    <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>{totalLabel}</p>
                </div>
                <div className="flex items-center gap-2 sm:justify-end">
                    <button
                        type="button"
                        onClick={() => exportToExcel(exportRecords)}
                        className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-black transition hk-soft-hover"
                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-success)" }}
                        title="Export all filtered records to Excel spreadsheet"
                    >
                        <FileSpreadsheet size={14} />
                        Excel
                    </button>
                    <button
                        type="button"
                        onClick={() => exportToPdf(exportRecords)}
                        className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-black transition hk-soft-hover"
                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-error)" }}
                        title="Export all filtered records to PDF report"
                    >
                        <FileText size={14} />
                        PDF
                    </button>
                </div>
            </div>
            <div className="max-h-[32rem] overflow-auto rounded-xl border" style={{ borderColor: "var(--color-border)" }}>
                <table className="w-full min-w-[1200px] text-left text-sm">
                    <thead className="sticky top-0 z-10 backdrop-blur-xl" style={{ backgroundColor: "color-mix(in srgb, var(--color-card) 96%, transparent)" }}>
                        <tr style={{ color: "var(--color-muted)" }}>
                            {columns.map((heading) => (
                                <th key={heading} className="border-b px-3 py-3 text-[0.65rem] font-black uppercase tracking-wide" style={{ borderColor: "var(--color-border)" }}>
                                    {heading}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((record) => (
                            <RecordTableRow key={record.id} record={record} onViewDetails={onViewDetails} />
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="-mx-5 -mb-5 mt-5 border-t px-5 py-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
            </div>
        </motion.article>
    );
}
