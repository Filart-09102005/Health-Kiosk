import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import ExportExcelButton from "./ExportExcelButton";
import ExportPDFButton from "./ExportPDFButton";
import HealthStatusChart from "./HealthStatusChart";
import MeasurementTrendChart from "./MeasurementTrendChart";
import PrintReportButton from "./PrintReportButton";
import ReportActivityTimeline from "./ReportActivityTimeline";
import ReportInsightCard from "./ReportInsightCard";
import ReportSummaryCard from "./ReportSummaryCard";

export default function ReportPreviewDrawer({ report, open, onClose }) {
    return (
        <AnimatePresence>
            {open && report ? (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
                    <motion.aside
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                        className="fixed right-0 top-0 z-50 h-full w-full max-w-3xl overflow-y-auto border-l p-5 shadow-2xl"
                        style={{ backgroundColor: "var(--color-bg)", borderColor: "var(--color-border)" }}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-muted)" }}>Report preview</p>
                                <h3 className="mt-1 text-2xl font-black">{report.name}</h3>
                            </div>
                            <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-[12px] border transition hk-admin-nav-hover" style={{ borderColor: "var(--color-border)" }}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mt-5 space-y-4">
                            <ReportSummaryCard report={report} />

                            <div className="grid gap-3 sm:grid-cols-3">
                                <ReportInsightCard label="Total records" value={report.totalRecords} />
                                <ReportInsightCard label="Format" value={report.format} />
                                <ReportInsightCard label="Role filter" value={report.roleFilter} />
                            </div>

                            <div className="rounded-[14px] border p-4" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                                <p className="font-black">Included filters</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {[report.dateRange, report.roleFilter, report.measurementType, report.status].map((item) => (
                                        <span key={item} className="rounded-full border px-3 py-1 text-xs font-black" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>{item}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-2">
                                <HealthStatusChart />
                                <MeasurementTrendChart />
                            </div>

                            <div className="rounded-[14px] border p-4" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                                <p className="mb-4 font-black">Report activity</p>
                                <ReportActivityTimeline />
                            </div>

                            <div className="rounded-[14px] border p-4" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                                <p className="font-black">Print preview</p>
                                <div className="mt-3 rounded-[12px] border p-4 text-sm font-bold leading-7" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-muted)" }}>
                                    School Health Kiosk report summary for {report.dateRange}. Includes role filter, measurement breakdown, generated-by information, and export history.
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
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
}
