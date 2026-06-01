import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import BMIStatusCard from "./BMIStatusCard";
import MeasurementSummaryCard from "./MeasurementSummaryCard";
import PrintReceiptButton from "./PrintReceiptButton";
import RecordDetailsSkeleton from "./RecordDetailsSkeleton";
import RecordTimeline from "./RecordTimeline";
import SessionInformationCard from "./SessionInformationCard";

export default function RecordDetailsDrawer({ open, record, loading, onClose }) {
    const [activeRecord, setActiveRecord] = useState(record);

    useEffect(() => {
        setActiveRecord(record);
    }, [record]);

    const sessions = useMemo(() => {
        if (!record) return [];

        return [record, ...(record.sessionHistory || [])];
    }, [record]);

    useEffect(() => {
        if (!open) return undefined;

        const bodyOverflow = document.body.style.overflow;
        const htmlOverflow = document.documentElement.style.overflow;
        const bodyOverscroll = document.body.style.overscrollBehavior;
        const bodyPosition = document.body.style.position;
        const bodyTop = document.body.style.top;
        const bodyWidth = document.body.style.width;
        const appRoot = document.getElementById("app");
        const appOverflow = appRoot?.style.overflow;
        const scrollY = window.scrollY;

        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
        document.body.style.overscrollBehavior = "none";
        document.body.style.position = "fixed";
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = "100%";

        if (appRoot) {
            appRoot.style.overflow = "hidden";
        }

        return () => {
            document.body.style.overflow = bodyOverflow;
            document.documentElement.style.overflow = htmlOverflow;
            document.body.style.overscrollBehavior = bodyOverscroll;
            document.body.style.position = bodyPosition;
            document.body.style.top = bodyTop;
            document.body.style.width = bodyWidth;

            if (appRoot) {
                appRoot.style.overflow = appOverflow || "";
            }

            window.scrollTo(0, scrollY);
        };
    }, [open]);

    const drawer = (
        <AnimatePresence>
            {open ? (
                <>
                    <motion.button
                        type="button"
                        aria-label="Close drawer"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed left-0 top-0 z-[900] h-screen w-screen bg-black/60 backdrop-blur-[3px]"
                        onClick={onClose}
                    />
                    <motion.aside
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 320, damping: 32 }}
                        className="fixed inset-y-0 right-0 z-[910] flex h-screen w-full max-w-xl flex-col overflow-hidden border-l shadow-2xl backdrop-blur-xl"
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
                                <h3 className="mt-1 text-lg font-black">{activeRecord?.fullName || "Loading record"}</h3>
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

                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                            {loading || ! activeRecord ? (
                                <RecordDetailsSkeleton />
                            ) : (
                                <div className="space-y-4 p-5">
                                    <article className="rounded-2xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                                        <p className="text-xs font-black uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>User information</p>
                                        <p className="mt-2 text-sm font-black">{activeRecord.fullName}</p>
                                        <div className="mt-3 grid gap-2 text-xs font-bold sm:grid-cols-2" style={{ color: "var(--color-muted)" }}>
                                            <p>School ID: <span style={{ color: "var(--color-text)" }}>{activeRecord.schoolId}</span></p>
                                            <p>Role: <span style={{ color: "var(--color-text)" }}>{activeRecord.role}</span></p>
                                            <p>Department: <span style={{ color: "var(--color-text)" }}>{activeRecord.department}</span></p>
                                            <p>Recorded: <span style={{ color: "var(--color-text)" }}>{activeRecord.recordedAt}</span></p>
                                        </div>
                                    </article>
                                    <SessionInformationCard record={activeRecord} />
                                    <MeasurementSummaryCard record={activeRecord} />
                                    <BMIStatusCard record={activeRecord} />
                                    <article className="rounded-2xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                                        <p className="text-sm font-black">Session activity timeline</p>
                                        <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>Accountability trace for this kiosk session</p>
                                        <div className="mt-4">
                                            <RecordTimeline events={activeRecord.timeline} />
                                        </div>
                                    </article>
                                    {sessions.length > 1 ? (
                                        <>
                                            <div className="flex items-center gap-3 py-1" aria-hidden="true">
                                                <span className="h-px flex-1" style={{ backgroundColor: "var(--color-border)" }} />
                                                <span className="text-[0.65rem] font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-muted)" }}>
                                                    Past records
                                                </span>
                                                <span className="h-px flex-1" style={{ backgroundColor: "var(--color-border)" }} />
                                            </div>
                                            <SessionHistoryCard
                                                activeRecord={activeRecord}
                                                sessions={sessions}
                                                onView={setActiveRecord}
                                            />
                                        </>
                                    ) : null}
                                </div>
                            )}
                        </div>

                        <div className="border-t p-5" style={{ borderColor: "var(--color-border)" }}>
                            {activeRecord ? <PrintReceiptButton record={activeRecord} /> : null}
                        </div>
                    </motion.aside>
                </>
            ) : null}
        </AnimatePresence>
    );

    if (typeof document === "undefined") {
        return null;
    }

    return createPortal(drawer, document.body);
}

function SessionHistoryCard({ activeRecord, sessions, onView }) {
    return (
        <article className="rounded-2xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-black">Session history</p>
                    <p className="mt-1 text-xs font-semibold" style={{ color: "var(--color-muted)" }}>
                        {sessions.length} records found for this user
                    </p>
                </div>
                <span className="rounded-full px-3 py-1 text-xs font-black" style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, transparent)", color: "var(--color-primary)" }}>
                    Latest first
                </span>
            </div>

            <div className="mt-4 space-y-2">
                {sessions.map((session, index) => {
                    const isActive = session.sessionId === activeRecord.sessionId;

                    return (
                        <div
                            key={session.sessionId}
                            className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"
                            style={{
                                borderColor: isActive ? "var(--color-primary)" : "var(--color-border)",
                                backgroundColor: isActive ? "color-mix(in srgb, var(--color-primary) 8%, var(--color-card))" : "var(--color-card)",
                            }}
                        >
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-black">{session.sessionId}</p>
                                    {index === 0 ? (
                                        <span className="rounded-full px-2 py-0.5 text-[0.65rem] font-black uppercase tracking-wide" style={{ backgroundColor: "color-mix(in srgb, var(--color-success) 14%, transparent)", color: "var(--color-success)" }}>
                                            Latest
                                        </span>
                                    ) : null}
                                </div>
                                <p className="mt-1 text-xs font-semibold" style={{ color: "var(--color-muted)" }}>
                                    {session.recordedAt} · {session.kiosk} · {session.healthStatus}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => onView(session)}
                                disabled={isActive}
                                className="rounded-xl border px-4 py-2 text-xs font-black transition hk-soft-hover disabled:cursor-default disabled:opacity-60"
                                style={{
                                    borderColor: isActive ? "var(--color-primary)" : "var(--color-border)",
                                    backgroundColor: isActive ? "var(--color-primary)" : "var(--color-surface)",
                                    color: isActive ? "#ffffff" : "var(--color-text)",
                                }}
                            >
                                {isActive ? "Viewing" : "View"}
                            </button>
                        </div>
                    );
                })}
            </div>
        </article>
    );
}
