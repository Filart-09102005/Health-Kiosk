import { AnimatePresence, motion } from "framer-motion";
import { X, Sparkles, FileText } from "lucide-react";
import { createPortal } from "react-dom";
import useModalLayer from "../../../../Global/useModalLayer";
import ExportExcelButton from "./ExportExcelButton";
import ExportPDFButton from "./ExportPDFButton";
import HealthStatusChart from "./HealthStatusChart";
import MeasurementTrendChart from "./MeasurementTrendChart";
import PrintReportButton from "./PrintReportButton";
import ReportActivityTimeline from "./ReportActivityTimeline";
import ReportInsightCard from "./ReportInsightCard";
import ReportSummaryCard from "./ReportSummaryCard";

export default function ReportPreviewDrawer({ report, open, onClose }) {
    useModalLayer(open);

    const drawer = (
        <AnimatePresence>
            {open && report ? (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9000] bg-black/75 backdrop-blur-md cursor-pointer"
                        onClick={onClose}
                    />
                    <motion.aside
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 280, damping: 30 }}
                        className="fixed right-0 top-0 z-[9010] h-full w-full max-w-3xl overflow-y-auto border-l p-6 shadow-2xl space-y-5"
                        style={{ backgroundColor: "var(--color-bg)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 border-b pb-4" style={{ borderColor: "var(--color-border)" }}>
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border shrink-0" style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, var(--color-surface))", borderColor: "color-mix(in srgb, var(--color-primary) 30%, transparent)", color: "var(--color-primary)" }}>
                                    <FileText size={22} />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--color-primary)" }}>
                                        <Sparkles size={12} />
                                        Report Preview
                                    </p>
                                    <h3 className="text-xl font-black" style={{ color: "var(--color-text)" }}>{report.name}</h3>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition hk-soft-hover"
                                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-muted)" }}
                                aria-label="Close preview drawer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Summary & Insights */}
                        <div className="space-y-4">
                            <ReportSummaryCard report={report} />

                            <div className="grid gap-3 sm:grid-cols-3">
                                <ReportInsightCard label="Total records" value={report.totalRecords} />
                                <ReportInsightCard label="Format" value={report.format} />
                                <ReportInsightCard label="Role filter" value={report.roleFilter} />
                            </div>

                            {/* Included Filters */}
                            <div className="rounded-2xl border p-4 shadow-sm" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                                <p className="font-black text-sm mb-3" style={{ color: "var(--color-text)" }}>Included Filters</p>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        report.dateRange,
                                        report.roleFilter,
                                        report.genderFilter,
                                        report.departmentFilter,
                                        report.academicFilter,
                                        report.measurementType,
                                        report.status,
                                    ].map((item, index) => (
                                        <span
                                            key={`${item}-${index}`}
                                            className="rounded-xl border px-3 py-1 text-xs font-bold"
                                            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                                        >
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Charts */}
                            <div className="grid gap-4 lg:grid-cols-2">
                                <HealthStatusChart />
                                <MeasurementTrendChart />
                            </div>

                            {/* Activity */}
                            <div className="rounded-2xl border p-4 shadow-sm" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                                <p className="mb-4 font-black text-sm" style={{ color: "var(--color-text)" }}>Report Activity Timeline</p>
                                <ReportActivityTimeline />
                            </div>

                            {/* Print Preview Summary */}
                            <div className="rounded-2xl border p-4 shadow-sm" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                                <p className="font-black text-sm" style={{ color: "var(--color-text)" }}>Print Preview Summary</p>
                                <div className="mt-3 rounded-xl border p-4 text-xs font-semibold leading-6" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-muted)" }}>
                                    School Health Kiosk report summary for {report.dateRange}. Includes role filter, measurement breakdown, generated-by information, and export history.
                                    Applied cohort: {report.roleFilter}; {report.genderFilter}; {report.departmentFilter}; {report.academicFilter}.
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid gap-3 sm:grid-cols-3 pt-2">
                                <ExportPDFButton />
                                <ExportExcelButton />
                                <PrintReportButton />
                            </div>
                        </div>
                    </motion.aside>
                </>
            ) : null}
        </AnimatePresence>
    );

    return createPortal(drawer, document.body);
}
