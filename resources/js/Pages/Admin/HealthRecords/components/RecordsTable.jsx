import { motion, useReducedMotion } from "framer-motion";
import { FileSpreadsheet, FileText } from "lucide-react";
import { exportToExcel, exportToPdf } from "../utils/exportRecords";
import { cardClassName, cardStyle } from "../utils/surface";
import Pagination from "../../../../Global/TablePagination";
import RecordTableRow from "./RecordTableRow";
import ShimmerSkeleton from "./ShimmerSkeleton";
import ExportActionButton from "../../../../Global/ExportActionButton";

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

export default function RecordsTable({ records, page, totalPages, onPageChange, onViewDetails, totalLabel, exportRecords = records, loading = false }) {
    const shouldReduceMotion = useReducedMotion();

    return (
        <motion.article
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldReduceMotion ? { duration: 0.01 } : { delay: 0.22, duration: 0.34, ease: "easeOut" }}
            className={`${cardClassName} overflow-hidden p-5`}
            style={cardStyle}
        >
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h3 className="text-base font-black tracking-tight" style={{ color: "var(--color-text)" }}>
                        Health records table
                    </h3>
                    <p className="mt-0.5 text-xs font-semibold" style={{ color: "var(--color-muted)" }}>{totalLabel}</p>
                </div>
                <div className="flex items-center gap-2 sm:justify-end">
                    <ExportActionButton
                        label="Excel"
                        icon={FileSpreadsheet}
                        iconColor="var(--color-success)"
                        accent="var(--color-success)"
                        onExport={() => exportToExcel(exportRecords)}
                        title="Export all filtered records to Excel spreadsheet"
                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                    />
                    <ExportActionButton
                        label="PDF"
                        icon={FileText}
                        iconColor="var(--color-error)"
                        accent="var(--color-error)"
                        onExport={() => exportToPdf(exportRecords)}
                        title="Export all filtered records to PDF report"
                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                    />
                </div>
            </div>
            {/* Sized to hold a full page of 15 collapsed rows (measured at
                ~1910px, since each row carries a date plus measurement badges)
                so nothing is hidden by default. It only begins scrolling once a
                record is expanded. The slim indicator covers both axes. */}
            <div
                className="hk-slim-scroll max-h-[121rem] overflow-auto rounded-xl border"
                style={{ borderColor: "var(--color-border)" }}
            >
                <table className="hk-table w-full min-w-[1200px] text-sm">
                    <thead>
                        <tr>
                            {columns.map((heading) => (
                                <th key={heading} className="whitespace-nowrap">
                                    {heading}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 15 }).map((_, rowIndex) => (
                                <tr key={`skeleton-${rowIndex}`} className="border-b" style={{ borderColor: "var(--color-border)" }}>
                                    <td className="px-3 py-3.5"><ShimmerSkeleton className="h-4 w-20" /></td>
                                    <td className="px-3 py-3.5">
                                        <ShimmerSkeleton className="h-4 w-32" />
                                        <ShimmerSkeleton className="mt-2 h-3 w-24" />
                                    </td>
                                    <td className="px-3 py-3.5"><ShimmerSkeleton className="h-3 w-14" /></td>
                                    <td className="px-3 py-3.5"><ShimmerSkeleton className="h-4 w-12" /></td>
                                    <td className="px-3 py-3.5"><ShimmerSkeleton className="h-4 w-14" /></td>
                                    <td className="px-3 py-3.5"><ShimmerSkeleton className="h-4 w-12" /></td>
                                    <td className="px-3 py-3.5"><ShimmerSkeleton className="h-4 w-14" /></td>
                                    <td className="px-3 py-3.5"><ShimmerSkeleton className="h-4 w-14" /></td>
                                    <td className="px-3 py-3.5"><ShimmerSkeleton className="h-4 w-10" /></td>
                                    <td className="px-3 py-3.5"><ShimmerSkeleton className="h-6 w-16 rounded-full" /></td>
                                    <td className="px-3 py-3.5"><ShimmerSkeleton className="h-6 w-20 rounded-full" /></td>
                                    <td className="px-3 py-3.5">
                                        <ShimmerSkeleton className="h-3 w-24" />
                                        <ShimmerSkeleton className="mt-2 h-5 w-20 rounded-full" />
                                    </td>
                                    <td className="px-3 py-3.5"><ShimmerSkeleton className="h-9 w-9 rounded-xl" /></td>
                                </tr>
                            ))
                        ) : (
                            records.map((record) => (
                                <RecordTableRow key={record.id} record={record} onViewDetails={onViewDetails} />
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="-mx-5 -mb-5 mt-5 border-t px-5 py-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
            </div>
        </motion.article>
    );
}
