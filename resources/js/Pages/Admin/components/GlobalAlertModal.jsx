import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertTriangle,
    BellRing,
    CheckCircle2,
    ClipboardList,
    Clock,
    FileText,
    X,
} from "lucide-react";
import { authService } from "../../Auth/services/authService";
import { isAlertsEnabled } from "../Alerts/utils/alertSensitivity";

// ─── Constants ────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 15_000; // poll every 15 seconds
const DISMISSED_KEY    = "hk_dismissed_alert_ids"; // sessionStorage key

const SEVERITY_CONFIG = {
    critical: {
        color:       "var(--alert-critical)",
        bgColor:     "var(--alert-critical-bg)",
        borderColor: "var(--alert-critical-border)",
        label:       "CRITICAL",
        autoDismiss: null, // never auto-dismiss
        barColor:    "#ef4444",
    },
    high: {
        color:       "var(--alert-high)",
        bgColor:     "var(--alert-high-bg)",
        borderColor: "var(--alert-high-border)",
        label:       "HIGH",
        autoDismiss: 15_000,
        barColor:    "#f97316",
    },
    moderate: {
        color:       "var(--alert-moderate)",
        bgColor:     "var(--alert-moderate-bg)",
        borderColor: "var(--alert-moderate-border)",
        label:       "MODERATE",
        autoDismiss: 10_000,
        barColor:    "#eab308",
    },
    low: {
        color:       "var(--alert-low)",
        bgColor:     "var(--alert-low-bg)",
        borderColor: "var(--alert-low-border)",
        label:       "LOW",
        autoDismiss: 8_000,
        barColor:    "#3b82f6",
    },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDismissed() {
    try {
        return new Set(JSON.parse(sessionStorage.getItem(DISMISSED_KEY) || "[]"));
    } catch {
        return new Set();
    }
}

function addDismissed(id) {
    try {
        const current = getDismissed();
        current.add(id);
        sessionStorage.setItem(DISMISSED_KEY, JSON.stringify([...current]));
    } catch {
        // ignore storage errors
    }
}

function getSeverityConfig(severity) {
    return SEVERITY_CONFIG[severity?.toLowerCase()] ?? SEVERITY_CONFIG.low;
}

function buildAlertMessage(alert) {
    if (alert.message) {
        return alert.message;
    }

    const severity = alert.severity?.toLowerCase() ?? "moderate";

    if (severity === "critical" || severity === "high") {
        return (
            <>
                <span style={{ color: "var(--color-text)", fontWeight: 900 }}>
                    {alert.fullName}
                </span>{" "}
                has a{" "}
                <span style={{ fontWeight: 900 }}>
                    {severity} {alert.measurementType?.toLowerCase() ?? "reading"}
                </span>{" "}
                and needs immediate attention. Please call the student and assess the condition.
            </>
        );
    }

    return (
        <>
            <span style={{ color: "var(--color-text)", fontWeight: 900 }}>
                {alert.fullName}
            </span>{" "}
            has an abnormal{" "}
            <span style={{ fontWeight: 900 }}>
                {alert.measurementType?.toLowerCase() ?? "reading"}
            </span>{" "}
            result and may need attention. Please call the student and assess the condition.
        </>
    );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function AlertProgressBar({ durationMs, color, onComplete }) {
    const [progress, setProgress] = useState(100);
    const rafRef    = useRef(null);
    const startRef  = useRef(null);

    useEffect(() => {
        if (!durationMs) return;

        startRef.current = performance.now();

        const tick = (now) => {
            const elapsed  = now - startRef.current;
            const remaining = Math.max(0, 100 - (elapsed / durationMs) * 100);
            setProgress(remaining);

            if (remaining > 0) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                onComplete?.();
            }
        };

        rafRef.current = requestAnimationFrame(tick);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [durationMs]);

    if (!durationMs) {
        // Critical — no timer, show static "no auto-dismiss" indicator
        return (
            <div
                className="relative h-1 overflow-hidden rounded-b-[2rem]"
                style={{ backgroundColor: "color-mix(in srgb, currentColor 12%, transparent)", color }}
            >
                <div
                    className="absolute inset-0 animate-pulse"
                    style={{ backgroundColor: color, opacity: 0.45 }}
                />
            </div>
        );
    }

    return (
        <div
            className="h-1.5 overflow-hidden rounded-b-[2rem]"
            style={{ backgroundColor: "color-mix(in srgb, currentColor 12%, transparent)", color }}
        >
            <div
                className="h-full rounded-full transition-none"
                style={{
                    width:           `${progress}%`,
                    backgroundColor: color,
                    transition:      "width 100ms linear",
                }}
            />
        </div>
    );
}

// ─── Detail Row ───────────────────────────────────────────────────────────────

function DetailRow({ label, value, highlight = false, highlightColor }) {
    return (
        <div
            className="flex items-start justify-between gap-3 rounded-xl px-3 py-2"
            style={{ backgroundColor: "var(--color-surface)" }}
        >
            <span className="text-xs font-bold" style={{ color: "var(--color-muted)", minWidth: "7.5rem" }}>
                {label}
            </span>
            <span
                className="text-right text-xs font-black"
                style={{ color: highlight ? highlightColor : "var(--color-text)" }}
            >
                {value}
            </span>
        </div>
    );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function AlertModal({ alert, onAcknowledge, onDismiss, onGoToAlerts, onViewHealthRecord }) {
    const cfg        = getSeverityConfig(alert.severity);
    const isCritical = alert.severity?.toLowerCase() === "critical";

    return (
        <motion.div
            key={alert.id}
            className="fixed inset-0 z-[9500] flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
        >
            {/* Full-screen backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <motion.div
                role="dialog"
                aria-modal="true"
                aria-label={`Health Alert: ${alert.fullName}`}
                className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden border shadow-2xl"
                initial={{ opacity: 0, y: 32, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.96 }}
                transition={{ duration: 0.26, ease: "easeOut" }}
                style={{
                    backgroundColor: "var(--color-card)",
                    borderColor:     cfg.borderColor ?? "var(--color-border)",
                    borderRadius:    "10px",
                    maxHeight:       "90vh",
                }}
            >
                {/* ── TOP ACCENT BAR ── */}
                <div className="h-1 shrink-0" style={{ backgroundColor: cfg.barColor }} />

                {/* ══════════════════════════════════════════
                    STICKY HEADER — always visible
                ══════════════════════════════════════════ */}
                <div
                    className="shrink-0 px-5 pt-4 pb-4"
                    style={{
                        borderBottom:    `1px solid var(--color-border)`,
                        backgroundColor: "var(--color-card)",
                    }}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            {/* Icon */}
                            <div
                                className="flex h-10 w-10 shrink-0 items-center justify-center"
                                style={{
                                    backgroundColor: cfg.bgColor,
                                    borderRadius: "8px",
                                }}
                            >
                                <AlertTriangle
                                    size={20}
                                    style={{ color: cfg.barColor }}
                                    className={isCritical ? "animate-pulse" : ""}
                                />
                            </div>

                            {/* Badges + label */}
                            <div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span
                                        className="rounded px-2 py-0.5 text-[0.6rem] font-black tracking-[0.12em] uppercase"
                                        style={{
                                            backgroundColor: cfg.bgColor,
                                            color:           cfg.barColor,
                                            borderRadius:    "4px",
                                        }}
                                    >
                                        {cfg.label}
                                    </span>
                                    {isCritical && (
                                        <span
                                            className="animate-pulse rounded px-2 py-0.5 text-[0.6rem] font-black tracking-[0.12em] uppercase"
                                            style={{ backgroundColor: "#ef4444", color: "#fff", borderRadius: "4px" }}
                                        >
                                            URGENT
                                        </span>
                                    )}
                                    <span
                                        className="text-[0.65rem] font-black uppercase tracking-[0.14em]"
                                        style={{ color: "var(--color-muted)" }}
                                    >
                                        {alert.alertCategory ? `${alert.alertCategory} Alert` : "Urgent Health Alert"}
                                    </span>
                                </div>

                                {/* Alert title */}
                                <p className="mt-1 text-sm font-black leading-tight" style={{ color: "var(--color-text)" }}>
                                    {alert.title}
                                </p>
                            </div>
                        </div>

                        {/* X close button */}
                        <button
                            type="button"
                            aria-label="Remind me later"
                            onClick={onDismiss}
                            className="flex h-8 w-8 shrink-0 items-center justify-center border transition hk-soft-hover"
                            style={{
                                backgroundColor: "var(--color-surface)",
                                borderColor:     "var(--color-border)",
                                borderRadius:    "6px",
                            }}
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>

                {/* ══════════════════════════════════════════
                    SCROLLABLE BODY
                ══════════════════════════════════════════ */}
                <div
                    className="hk-alert-body-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4"
                    style={{ overscrollBehavior: "contain" }}
                >
                    {/* Message */}
                    <p className="mb-4 text-sm leading-6" style={{ color: "var(--color-muted)" }}>
                        {buildAlertMessage(alert)}
                    </p>

                    {/* Student Details card */}
                    <div
                        className="mb-3 space-y-1.5 border p-3"
                        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", borderRadius: "8px" }}
                    >
                        <p className="mb-2 px-1 text-[0.65rem] font-black uppercase tracking-[0.14em]" style={{ color: "var(--color-muted)" }}>
                            Student Details
                        </p>
                        <DetailRow label="Student Name" value={alert.fullName} />
                        <DetailRow label="Student ID"   value={alert.studentId} />
                        <DetailRow label="Role"         value={alert.role} />
                        {alert.department && <DetailRow label="Department" value={alert.department} />}

                        {String(alert.department ?? "").toUpperCase().includes("COLLEGE") ? (
                            <>
                                <DetailRow label="Year Level" value={alert.yearLevel ?? "N/A"} />
                                <DetailRow label="Program"    value={alert.program    ?? "N/A"} />
                            </>
                        ) : (
                            <>
                                {alert.gradeLevel && <DetailRow label="Grade Level" value={alert.gradeLevel} />}
                                {alert.strand     && <DetailRow label="Strand"      value={alert.strand} />}
                            </>
                        )}
                    </div>

                    {/* Health Alert Details card */}
                    <div
                        className="mb-3 space-y-1.5 border p-3"
                        style={{ borderColor: cfg.borderColor ?? "var(--color-border)", backgroundColor: "color-mix(in srgb, var(--color-surface) 80%, transparent)", borderRadius: "8px" }}
                    >
                        <p className="mb-2 px-1 text-[0.65rem] font-black uppercase tracking-[0.14em]" style={{ color: "var(--color-muted)" }}>
                            Health Alert Details
                        </p>
                        <DetailRow label="Abnormal Part" value={alert.measurementType ?? "N/A"} highlight highlightColor={cfg.barColor} />
                        <DetailRow label="Result"        value={alert.measurementValue ?? "N/A"} highlight highlightColor={cfg.barColor} />
                        <DetailRow label="Alert Type"    value={alert.alertCategory ?? "Health Alert"} highlight highlightColor={cfg.barColor} />
                        <DetailRow label="Status"        value={alert.healthStatus ?? "Abnormal"} highlight highlightColor={cfg.barColor} />
                        <DetailRow label="Severity"      value={cfg.label} highlight highlightColor={cfg.barColor} />
                    </div>

                    {/* Recommended Action */}
                    {(alert.emergencyAction || alert.advice) && (
                        <div
                            className="border p-3"
                            style={{ borderColor: "var(--color-border)", borderRadius: "8px" }}
                        >
                            <p className="mb-1.5 text-[0.65rem] font-black uppercase tracking-[0.14em]" style={{ color: "var(--color-muted)" }}>
                                Recommended Action
                            </p>
                            <p className="text-xs leading-5 font-bold" style={{ color: "var(--color-text)" }}>
                                {alert.emergencyAction || alert.advice}
                            </p>
                        </div>
                    )}
                </div>

                {/* ══════════════════════════════════════════
                    STICKY FOOTER — always visible
                ══════════════════════════════════════════ */}
                <div
                    className="shrink-0 px-5 pt-3 pb-4"
                    style={{
                        borderTop:       `1px solid var(--color-border)`,
                        backgroundColor: "var(--color-card)",
                    }}
                >
                    {/* Auto-dismiss / critical note */}
                    {cfg.autoDismiss ? (
                        <p className="mb-3 flex items-center gap-1.5 text-[0.65rem]" style={{ color: "var(--color-muted)" }}>
                            <Clock size={11} />
                            Auto-fading after {cfg.autoDismiss / 1000}s if not acted upon
                        </p>
                    ) : (
                        <p className="mb-3 flex items-center gap-1.5 text-[0.65rem] font-bold" style={{ color: cfg.barColor }}>
                            <BellRing size={11} />
                            Critical alert — requires admin action before closing
                        </p>
                    )}

                    {/* Acknowledge — full width primary */}
                    <button
                        type="button"
                        id={`alert-acknowledge-${alert.id}`}
                        onClick={onAcknowledge}
                        className="mb-2 flex w-full items-center justify-center gap-2 py-2.5 text-sm font-black text-white transition hk-primary-hover"
                        style={{ backgroundColor: "var(--color-primary)", borderRadius: "8px" }}
                    >
                        <CheckCircle2 size={15} />
                        Acknowledge Alert
                    </button>

                    {/* Go to Alerts + Health Record — 2-col */}
                    <div className="mb-2 grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            id={`alert-goto-${alert.id}`}
                            onClick={onGoToAlerts}
                            className="flex items-center justify-center gap-1.5 border py-2.5 text-xs font-black transition hk-soft-hover"
                            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", borderRadius: "8px" }}
                        >
                            <BellRing size={13} />
                            Go to Alerts
                        </button>
                        <button
                            type="button"
                            id={`alert-view-record-${alert.id}`}
                            onClick={onViewHealthRecord}
                            className="flex items-center justify-center gap-1.5 border py-2.5 text-xs font-black transition hk-soft-hover"
                            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", borderRadius: "8px" }}
                        >
                            <FileText size={13} />
                            Health Record
                        </button>
                    </div>

                    {/* Remind Me Later — muted ghost */}
                    <button
                        type="button"
                        id={`alert-dismiss-${alert.id}`}
                        onClick={onDismiss}
                        className="flex w-full items-center justify-center gap-1.5 py-2 text-xs font-black transition"
                        style={{ color: "var(--color-muted)" }}
                    >
                        <ClipboardList size={12} />
                        Close / Remind Me Later
                    </button>

                    {/* Progress bar — very bottom of footer */}
                    <div className="mt-3 -mx-5 -mb-4">
                        <AlertProgressBar
                            durationMs={cfg.autoDismiss}
                            color={cfg.barColor}
                            onComplete={onDismiss}
                        />
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Global Alert Modal Controller ────────────────────────────────────────────

export default function GlobalAlertModal({ navigate }) {
    const [queue, setQueue]                 = useState([]);
    const [currentAlert, setCurrent]        = useState(null);
    const [visible, setVisible]             = useState(false);
    const [acknowledging, setAcknowledging] = useState(false);
    const pollingRef                        = useRef(null);

    // Tracks every alert ID that has been queued OR shown this session.
    // Prevents any alert from appearing more than once, even across poll cycles.
    const shownIdsRef = useRef(new Set());

    // Merge incoming alerts — skip anything already seen or dismissed
    const mergeQueue = useCallback((incoming) => {
        const dismissed = getDismissed();
        const shown     = shownIdsRef.current;

        const newOnes = incoming.filter(
            (a) => !dismissed.has(a.id) && !shown.has(a.id)
        );

        if (!newOnes.length) return;

        // Mark all as seen immediately so future polls skip them
        newOnes.forEach((a) => shown.add(a.id));

        setQueue((prev) =>
            [...prev, ...newOnes].sort((a, b) => a.severityOrder - b.severityOrder)
        );
    }, []);

    // Fetch unread alerts from the queue endpoint
    const pollQueue = useCallback(async () => {
        if (!isAlertsEnabled()) return;

        try {
            const res  = await authService.adminAlertsQueue();
            const data = res.data?.data ?? [];
            if (data.length) mergeQueue(data);
        } catch {
            // Silently ignore polling errors
        }
    }, [mergeQueue]);

    // Start polling on mount
    useEffect(() => {
        pollQueue();
        pollingRef.current = setInterval(pollQueue, POLL_INTERVAL_MS);

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [pollQueue]);

    // Advance queue — show next alert when current slot is empty
    useEffect(() => {
        if (currentAlert) return; // already showing one — do nothing

        if (queue.length === 0) {
            setVisible(false);
            return;
        }

        const [next, ...rest] = queue;
        // Ensure it's in shownIds (it should be, but belt-and-suspenders)
        shownIdsRef.current.add(next.id);
        setCurrent(next);
        setQueue(rest);
        setVisible(true);
    }, [queue, currentAlert]);

    // Acknowledge — marks read on backend; ID stays in shownIds → never re-queues
    const handleAcknowledge = useCallback(async () => {
        if (!currentAlert || acknowledging) return;

        setAcknowledging(true);

        try {
            await authService.acknowledgeAlert(currentAlert.id);
        } catch {
            // Even if the request fails, remove from UI so we don't loop
        } finally {
            setAcknowledging(false);
            setVisible(false);
            setTimeout(() => setCurrent(null), 300);
        }
    }, [currentAlert, acknowledging]);

    // Dismiss (Remind Me Later) — stores ID in sessionStorage; shownIds already set
    const handleDismiss = useCallback(() => {
        if (!currentAlert) return;
        addDismissed(currentAlert.id); // sessionStorage — survives polls
        setVisible(false);
        setTimeout(() => setCurrent(null), 300);
    }, [currentAlert]);

    // Go to Alerts Page
    const handleGoToAlerts = useCallback(() => {
        navigate?.("/admin/alerts");
        handleDismiss();
    }, [navigate, handleDismiss]);

    // View Health Record
    const handleViewHealthRecord = useCallback(() => {
        if (!currentAlert) return;
        const sessionId = currentAlert.kioskSessionId;
        navigate?.(sessionId
            ? `/admin/health-records?session_id=${sessionId}`
            : "/admin/health-records"
        );
        handleDismiss();
    }, [currentAlert, navigate, handleDismiss]);

    if (!currentAlert) return null;

    return createPortal(
        <AnimatePresence mode="wait">
            {visible && (
                <AlertModal
                    key={currentAlert.id}
                    alert={currentAlert}
                    onAcknowledge={handleAcknowledge}
                    onDismiss={handleDismiss}
                    onGoToAlerts={handleGoToAlerts}
                    onViewHealthRecord={handleViewHealthRecord}
                />
            )}
        </AnimatePresence>,
        document.body
    );
}
