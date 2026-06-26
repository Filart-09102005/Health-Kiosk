import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import useModalLayer from "../../../../Global/useModalLayer";
import AlertSummaryCard from "./AlertSummaryCard";
import AlertTimeline from "./AlertTimeline";
import MeasurementBreakdownCard from "./MeasurementBreakdownCard";
import ResolveAlertButton from "./ResolveAlertButton";
import ReviewAlertButton from "./ReviewAlertButton";
import SessionInformationCard from "./SessionInformationCard";
import UserHealthSummaryCard from "./UserHealthSummaryCard";

export default function AlertDetailsDrawer({ alert, open, onClose }) {
    useModalLayer(open);

    const drawer = (
        <AnimatePresence>
            {open && alert ? (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9000] bg-black/65 backdrop-blur-md" onClick={onClose} />
                    <motion.aside
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                        className="fixed right-0 top-0 z-[9010] h-full w-full max-w-2xl overflow-y-auto border-l p-5 shadow-2xl"
                        style={{ backgroundColor: "var(--color-bg)", borderColor: "var(--color-border)" }}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-muted)" }}>Alert details</p>
                                <h3 className="mt-1 text-2xl font-black">{alert.fullName}</h3>
                            </div>
                            <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-[12px] border transition hk-admin-nav-hover" style={{ borderColor: "var(--color-border)" }}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mt-5 space-y-4">
                            <AlertSummaryCard alert={alert} />
                            <UserHealthSummaryCard alert={alert} />
                            <SessionInformationCard alert={alert} />
                            <MeasurementBreakdownCard alert={alert} />
                            <div className="rounded-[14px] border p-4" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                                <p className="mb-4 font-black">Response timeline</p>
                                <AlertTimeline />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <ReviewAlertButton />
                                <ResolveAlertButton />
                            </div>
                        </div>
                    </motion.aside>
                </>
            ) : null}
        </AnimatePresence>
    );

    return createPortal(drawer, document.body);
}
