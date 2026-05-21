import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import BMIStatusCard from "./BMIStatusCard";
import MeasurementSummaryCard from "./MeasurementSummaryCard";
import PrintReceiptButton from "./PrintReceiptButton";
import RecordDetailsSkeleton from "./RecordDetailsSkeleton";
import RecordTimeline from "./RecordTimeline";
import SessionInformationCard from "./SessionInformationCard";

export default function RecordDetailsDrawer({ open, record, loading, onClose }) {
    return (
        <AnimatePresence>
            {open ? (
                <>
                    <motion.button
                        type="button"
                        aria-label="Close drawer"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
                        onClick={onClose}
                    />
                    <motion.aside
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 320, damping: 32 }}
                        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col border-l shadow-2xl backdrop-blur-xl"
                        style={{
                            backgroundColor: "color-mix(in srgb, var(--color-card) 96%, transparent)",
                            borderColor: "var(--color-border)",
                        }}
                    >
                        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--color-border)" }}>
                            <div>
                                <p className="text-xs font-black uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
                                    Record details
                                </p>
                                <h3 className="mt-1 text-lg font-black">{record?.fullName || "Loading record"}</h3>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border transition hk-soft-hover"
                                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto">
                            {loading || ! record ? (
                                <RecordDetailsSkeleton />
                            ) : (
                                <div className="space-y-4 p-5">
                                    <article className="rounded-2xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                                        <p className="text-xs font-black uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>User information</p>
                                        <p className="mt-2 text-sm font-black">{record.fullName}</p>
                                        <div className="mt-3 grid gap-2 text-xs font-bold sm:grid-cols-2" style={{ color: "var(--color-muted)" }}>
                                            <p>School ID: <span style={{ color: "var(--color-text)" }}>{record.schoolId}</span></p>
                                            <p>Role: <span style={{ color: "var(--color-text)" }}>{record.role}</span></p>
                                            <p>Department: <span style={{ color: "var(--color-text)" }}>{record.department}</span></p>
                                            <p>Recorded: <span style={{ color: "var(--color-text)" }}>{record.recordedAt}</span></p>
                                        </div>
                                    </article>
                                    <SessionInformationCard record={record} />
                                    <MeasurementSummaryCard record={record} />
                                    <BMIStatusCard record={record} />
                                    <article className="rounded-2xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                                        <p className="text-sm font-black">Session activity timeline</p>
                                        <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>Accountability trace for this kiosk session</p>
                                        <div className="mt-4">
                                            <RecordTimeline events={record.timeline} />
                                        </div>
                                    </article>
                                </div>
                            )}
                        </div>

                        <div className="border-t p-5" style={{ borderColor: "var(--color-border)" }}>
                            {record ? <PrintReceiptButton record={record} /> : null}
                        </div>
                    </motion.aside>
                </>
            ) : null}
        </AnimatePresence>
    );
}
