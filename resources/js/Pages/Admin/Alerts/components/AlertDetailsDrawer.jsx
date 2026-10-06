import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import useModalLayer from "../../../../Global/useModalLayer";
import AlertSummaryCard from "./AlertSummaryCard";
import AlertTimeline from "./AlertTimeline";
import MeasurementBreakdownCard from "./MeasurementBreakdownCard";
import SessionInformationCard from "./SessionInformationCard";
import UserHealthSummaryCard from "./UserHealthSummaryCard";
import AlertResolutionForm from "./AlertResolutionForm";

const SEVERITY_ACCENT = {
    Critical: "var(--alert-critical)",
    High: "var(--alert-high)",
    Medium: "var(--alert-moderate)",
    Low: "var(--alert-low)",
};

export default function AlertDetailsDrawer({ alert, open, onClose, onResolved }) {
    useModalLayer(open);
    const accent = SEVERITY_ACCENT[alert?.severity] || "var(--color-primary)";

    const drawer = (
        <AnimatePresence>
            {open && alert ? (
                <>
                <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/65 backdrop-blur-md" onClick={onClose} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        className="relative z-[9010] flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-3xl border shadow-2xl"
                        style={{ backgroundColor: "var(--color-bg)", borderColor: "var(--color-border)" }}
                    >
                        <div className="h-1.5 shrink-0" style={{ backgroundColor: accent }} />

                        <div className="shrink-0 px-6 pt-5 pb-4 sm:px-8" style={{ borderBottom: "1px solid var(--color-border)" }}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-muted)" }}>
                                        Alert details · {alert.id}
                                    </p>
                                    <h3 className="mt-1 truncate text-2xl font-black">{alert.fullName}</h3>
                                </div>
                                <button onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] border transition hk-admin-nav-hover" style={{ borderColor: "var(--color-border)" }}>
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-8">
                            <div className="space-y-4">
                                <AlertSummaryCard alert={alert} />
                                <UserHealthSummaryCard alert={alert} />

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <SessionInformationCard alert={alert} />
                                    <MeasurementBreakdownCard alert={alert} />
                                </div>

                                <div className="rounded-[1.25rem] border p-4" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                                    <p className="mb-4 text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--color-muted)" }}>Response timeline</p>
                                    <AlertTimeline alert={alert} />
                                </div>
                                <AlertResolutionForm alert={alert} onResolved={onResolved} />
                            </div>
                        </div>
                    </motion.div>
                </div>
                </>
            ) : null}
        </AnimatePresence>
    );

    return createPortal(drawer, document.body);
}
