import { AnimatePresence, motion } from "framer-motion";
import { CalendarClock, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import useModalLayer from "../../../../Global/useModalLayer";
import UserAvatar from "../../Users/components/UserAvatar";
import BMIStatusCard from "./BMIStatusCard";
import MeasurementSummaryCard from "./MeasurementSummaryCard";
import PrintReceiptButton from "./PrintReceiptButton";
import RecordDetailsSkeleton from "./RecordDetailsSkeleton";
import RecordTimeline from "./RecordTimeline";
import SessionInformationCard from "./SessionInformationCard";

export default function RecordDetailsDrawer({ open, record, loading, onClose }) {
    const [activeRecord, setActiveRecord] = useState(record);
    // Set while swapping between sessions in the history list.
    const [switching, setSwitching] = useState(false);
    const bodyRef = useRef(null);
    const switchTimer = useRef(null);
    useModalLayer(open);

    useEffect(() => {
        setActiveRecord(record);
    }, [record]);

    useEffect(() => () => window.clearTimeout(switchTimer.current), []);

    /**
     * Switch the drawer to another session from the history list.
     *
     * The record is already in memory, so there is nothing to fetch — but
     * swapping the whole body instantly, while the reader is scrolled somewhere
     * down the previous session, lands them mid-content with no sense that
     * anything changed. A brief skeleton plus a jump back to the top makes the
     * change legible.
     */
    const viewSession = (session) => {
        if (session?.id === activeRecord?.id) return;

        setSwitching(true);
        bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });

        window.clearTimeout(switchTimer.current);
        switchTimer.current = window.setTimeout(() => {
            setActiveRecord(session);
            setSwitching(false);
        }, 260);
    };

    const sessions = useMemo(() => {
        if (!record) return [];

        return [record, ...(record.sessionHistory || [])];
    }, [record]);

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
                        className="fixed left-0 top-0 z-[9000] h-screen w-screen bg-black/65 backdrop-blur-md"
                        onClick={onClose}
                    />
                    <motion.aside
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 320, damping: 32 }}
                        className="fixed inset-y-0 right-0 z-[9010] flex h-screen w-full max-w-xl flex-col overflow-hidden border-l shadow-2xl backdrop-blur-xl"
                        style={{
                            backgroundColor: "color-mix(in srgb, var(--color-card) 96%, transparent)",
                            borderColor: "var(--color-border)",
                        }}
                    >
                        {/* Header carries the person, not just a label — the
                            avatar and identifiers here mean the cards below no
                            longer have to repeat who this record belongs to. */}
                        <div
                            className="relative flex items-start justify-between gap-4 overflow-hidden border-b px-5 py-5"
                            style={{ borderColor: "var(--color-border)" }}
                        >
                            <span
                                aria-hidden="true"
                                className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full"
                                style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--color-primary) 14%, transparent), transparent 70%)" }}
                            />

                            <div className="relative flex min-w-0 items-center gap-3.5">
                                <UserAvatar
                                    firstname={(activeRecord?.fullName || "").split(" ")[0] || "?"}
                                    lastname={(activeRecord?.fullName || "").split(" ").slice(-1)[0] || ""}
                                    size={48}
                                />
                                <div className="min-w-0">
                                    <p className="text-[0.62rem] font-black uppercase tracking-[0.2em]" style={{ color: "var(--color-primary)" }}>
                                        Record details
                                    </p>
                                    <h3 className="mt-0.5 truncate text-xl font-black tracking-tight">
                                        {activeRecord?.fullName || "Loading record"}
                                    </h3>
                                    {activeRecord ? (
                                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                            <span className="hk-pill" style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, transparent)", color: "var(--color-primary)" }}>
                                                {activeRecord.role}
                                            </span>
                                            <span className="hk-pill" style={{ backgroundColor: "var(--color-surface)", color: "var(--color-muted)", border: "1px solid var(--color-border)" }}>
                                                {activeRecord.department}
                                            </span>
                                            <span className="text-[0.68rem] font-bold" style={{ color: "var(--color-muted)" }}>
                                                {activeRecord.schoolId}
                                            </span>
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Close record details"
                                className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition hk-soft-hover"
                                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div ref={bodyRef} className="hk-slim-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
                            {loading || switching || ! activeRecord ? (
                                <RecordDetailsSkeleton />
                            ) : (
                                <div className="space-y-4 p-5">
                                    {/* Identity now lives in the drawer header, so
                                        this card carries only what the header
                                        does not: when the reading was taken. */}
                                    <article
                                        className="flex items-center gap-3 rounded-2xl border px-4 py-3.5"
                                        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                                    >
                                        <span
                                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                                            style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 11%, transparent)", color: "var(--color-primary)" }}
                                        >
                                            <CalendarClock size={17} />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-[0.62rem] font-black uppercase tracking-[0.16em]" style={{ color: "var(--color-muted)" }}>
                                                Recorded
                                            </p>
                                            <p className="mt-0.5 text-sm font-black">{activeRecord.recordedAt}</p>
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
                                                onView={viewSession}
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
