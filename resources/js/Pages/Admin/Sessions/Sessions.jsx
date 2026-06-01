import { Activity, CheckCircle2, Eye, TimerReset, TriangleAlert, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AdminShell from "../components/AdminShell";
import AdminModulePage from "../components/AdminModulePage";
import { getHealthRecordSessions } from "../HealthRecords/data/demoData";

const PAGE_SIZE = 10;
const phDateTime = new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
});

const sessionRecords = getHealthRecordSessions()
    .map((session, index) => ({
        ...session,
        id: session.sessionId || index + 1,
        displaySessionId: `SES-${index + 1}`,
        startedAt: getSessionStartedAt(session),
        endedAt: getSessionEndedAt(session),
        duration: getSessionDuration(session),
    }))
    .sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt));

const completedCount = sessionRecords.filter((session) => session.status === "Completed").length;
const incompleteCount = sessionRecords.filter((session) => session.status !== "Completed").length;
const averageDuration = getAverageSessionDuration(sessionRecords);

export default function Sessions({ navigate }) {
    const [page, setPage] = useState(1);
    const [selectedSession, setSelectedSession] = useState(null);

    const totalPages = Math.max(1, Math.ceil(sessionRecords.length / PAGE_SIZE));
    const visibleSessions = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;

        return sessionRecords.slice(start, start + PAGE_SIZE);
    }, [page]);

    return (
        <AdminShell navigate={navigate} eyebrow="Kiosk Sessions" title="Session Tracking">
            <AdminModulePage
                icon={Activity}
                eyebrow="Session audit"
                title="Kiosk Sessions"
                description="Track every login session, kiosk flow, completed measurement set, logout, and timeout event."
                stats={[
                    { label: "Total Sessions Today", value: String(sessionRecords.length), caption: "Started kiosk sessions today", icon: Activity },
                    { label: "Completed Sessions", value: String(completedCount), caption: "Finished all required readings", icon: CheckCircle2 },
                    { label: "Incomplete Sessions", value: String(incompleteCount), caption: "Not yet completed or exited early", icon: TriangleAlert },
                    { label: "Average Session Duration", value: averageDuration, caption: "Average login to logout time", icon: TimerReset },
                ]}
            >
                <SessionsTable
                    sessions={visibleSessions}
                    page={page}
                    totalPages={totalPages}
                    totalRecords={sessionRecords.length}
                    onPageChange={setPage}
                    onViewSession={setSelectedSession}
                />
            </AdminModulePage>
            <SessionDetailsModal session={selectedSession} onClose={() => setSelectedSession(null)} />
        </AdminShell>
    );
}

function SessionsTable({ sessions, page, totalPages, totalRecords, onPageChange, onViewSession }) {
    const startRecord = (page - 1) * PAGE_SIZE + 1;
    const endRecord = Math.min(page * PAGE_SIZE, totalRecords);

    return (
        <section className="rounded-[14px] border p-5 shadow-xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h3 className="text-lg font-black">Kiosk session log</h3>
                    <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
                        Each login to logout flow is listed as its own session, even when the same user logs in again.
                    </p>
                </div>
                <p className="text-xs font-black" style={{ color: "var(--color-muted)" }}>
                    Showing {startRecord}-{endRecord} of {totalRecords}
                </p>
            </div>

            <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--color-border)" }}>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1040px] text-left text-sm">
                        <thead style={{ backgroundColor: "var(--color-surface)", color: "var(--color-muted)" }}>
                            <tr>
                                {["Session", "User", "School ID", "Role", "Method", "Status", "Started", "Ended", "Modules", "Action"].map((heading) => (
                                    <th key={heading} className="border-b px-3 py-3 text-[0.68rem] font-black uppercase tracking-wide" style={{ borderColor: "var(--color-border)" }}>
                                        {heading}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.map((session) => (
                                <tr key={session.id} className="transition hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,transparent)]">
                                    <td className="border-b px-3 py-3.5 font-black" style={{ borderColor: "var(--color-border)" }}>{session.displaySessionId}</td>
                                    <td className="border-b px-3 py-3.5" style={{ borderColor: "var(--color-border)" }}>
                                        <p className="font-black">{session.fullName}</p>
                                        <p className="text-xs font-bold" style={{ color: "var(--color-muted)" }}>{session.department}</p>
                                    </td>
                                    <td className="border-b px-3 py-3.5 font-bold" style={{ borderColor: "var(--color-border)" }}>{session.schoolId}</td>
                                    <td className="border-b px-3 py-3.5 font-bold" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>{session.role}</td>
                                    <td className="border-b px-3 py-3.5 font-bold" style={{ borderColor: "var(--color-border)" }}>{session.method}</td>
                                    <td className="border-b px-3 py-3.5" style={{ borderColor: "var(--color-border)" }}>
                                        <SessionStatus status={session.status} />
                                    </td>
                                    <td className="border-b px-3 py-3.5 text-xs font-bold" style={{ borderColor: "var(--color-border)" }}>{session.startedAt}</td>
                                    <td className="border-b px-3 py-3.5 text-xs font-bold" style={{ borderColor: "var(--color-border)" }}>
                                        {session.endedAt}
                                        <p className="mt-1 text-[0.65rem] font-black" style={{ color: "var(--color-muted)" }}>{session.duration}</p>
                                    </td>
                                    <td className="border-b px-3 py-3.5 font-black" style={{ borderColor: "var(--color-border)" }}>
                                        {session.measurementsCompleted}/{session.measurementsTotal}
                                    </td>
                                    <td className="border-b px-3 py-3.5" style={{ borderColor: "var(--color-border)" }}>
                                        <button
                                            type="button"
                                            onClick={() => onViewSession(session)}
                                            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black transition hk-admin-nav-hover"
                                            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                                        >
                                            <Eye size={14} />
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
                <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    className="rounded-lg border px-3 py-2 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-45 hk-admin-nav-hover"
                    style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                >
                    Previous
                </button>
                <span className="px-2 text-xs font-black" style={{ color: "var(--color-muted)" }}>
                    Page {page} of {totalPages}
                </span>
                <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    className="rounded-lg border px-3 py-2 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-45 hk-admin-nav-hover"
                    style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                >
                    Next
                </button>
            </div>
        </section>
    );
}

function SessionDetailsModal({ session, onClose }) {
    useEffect(() => {
        if (!session) return undefined;

        const scrollY = window.scrollY;
        const bodyOverflow = document.body.style.overflow;
        const htmlOverflow = document.documentElement.style.overflow;
        const bodyPosition = document.body.style.position;
        const bodyTop = document.body.style.top;
        const bodyWidth = document.body.style.width;

        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
        document.body.style.position = "fixed";
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = "100%";

        return () => {
            document.body.style.overflow = bodyOverflow;
            document.documentElement.style.overflow = htmlOverflow;
            document.body.style.position = bodyPosition;
            document.body.style.top = bodyTop;
            document.body.style.width = bodyWidth;
            window.scrollTo(0, scrollY);
        };
    }, [session]);

    if (!session) return null;

    return (
        <div className="fixed inset-0 z-[950] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <section className="w-full max-w-2xl overflow-hidden rounded-[16px] border shadow-2xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                <div className="flex items-start justify-between gap-4 border-b p-5" style={{ borderColor: "var(--color-border)" }}>
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-primary)" }}>Kiosk session details</p>
                        <h3 className="mt-1 text-xl font-black">{session.displaySessionId}</h3>
                        <p className="mt-1 text-sm font-bold" style={{ color: "var(--color-muted)" }}>
                            {session.fullName} - {session.schoolId}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border transition hk-admin-nav-hover"
                        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="max-h-[70vh] overflow-y-auto p-5">
                    <div className="grid gap-3 text-sm font-bold sm:grid-cols-2" style={{ color: "var(--color-muted)" }}>
                        <p>Status: <span style={{ color: "var(--color-text)" }}>{session.status}</span></p>
                        <p>Role: <span style={{ color: "var(--color-text)" }}>{session.role}</span></p>
                        <p>Method: <span style={{ color: "var(--color-text)" }}>{session.method}</span></p>
                        <p>Started: <span style={{ color: "var(--color-text)" }}>{session.startedAt}</span></p>
                        <p>Ended: <span style={{ color: "var(--color-text)" }}>{session.endedAt}</span></p>
                        <p>Duration: <span style={{ color: "var(--color-text)" }}>{session.duration}</span></p>
                        <p>Modules: <span style={{ color: "var(--color-text)" }}>{session.measurementsCompleted}/{session.measurementsTotal}</span></p>
                        <p>Health status: <span style={{ color: "var(--color-text)" }}>{session.healthStatus}</span></p>
                    </div>

                    <article className="mt-5 rounded-2xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                        <p className="text-sm font-black">Session activity timeline</p>
                        <p className="mt-1 text-xs font-bold" style={{ color: "var(--color-muted)" }}>
                            Accountability trace for this kiosk session
                        </p>
                        <div className="mt-4 space-y-3">
                            {session.timeline?.length ? session.timeline.map((event, index) => (
                                <div key={`${event.time}-${event.label}-${index}`} className="grid grid-cols-[5.5rem_1fr] gap-3">
                                    <p className="text-xs font-black" style={{ color: "var(--color-primary)" }}>{formatSessionClock(session, event.time) || event.time}</p>
                                    <div className="border-l pl-3" style={{ borderColor: "var(--color-border)" }}>
                                        <p className="text-sm font-black">{event.label}</p>
                                        <p className="mt-1 text-xs font-bold" style={{ color: "var(--color-muted)" }}>{event.detail}</p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm font-bold" style={{ color: "var(--color-muted)" }}>No timeline events recorded for this session.</p>
                            )}
                        </div>
                    </article>
                </div>
            </section>
        </div>
    );
}

function SessionStatus({ status }) {
    const completed = status === "Completed";

    return (
        <span
            className="rounded-full px-3 py-1 text-xs font-black"
            style={{
                color: completed ? "var(--color-success)" : "var(--color-primary)",
                backgroundColor: completed ? "color-mix(in srgb, var(--color-success) 12%, transparent)" : "color-mix(in srgb, var(--color-primary) 12%, transparent)",
            }}
        >
            {status}
        </span>
    );
}

function getSessionStartedAt(session) {
    const loginEvent = findTimelineEvent(session, "login") || session.timeline?.[0];

    return formatSessionClock(session, loginEvent?.time) || session.recordedAt;
}

function getSessionEndedAt(session) {
    const logoutEvent = findTimelineEvent(session, "logout");

    return logoutEvent ? formatSessionClock(session, logoutEvent.time) : "No logout yet";
}

function getSessionDuration(session) {
    const loginEvent = findTimelineEvent(session, "login") || session.timeline?.[0];
    const logoutEvent = findTimelineEvent(session, "logout");

    if (!logoutEvent) {
        return "Still active";
    }

    const started = parseSessionClock(session, loginEvent?.time);
    const ended = parseSessionClock(session, logoutEvent.time);

    if (!started || !ended) {
        return "Not available";
    }

    const minutes = Math.max(1, Math.round((ended.getTime() - started.getTime()) / 60000));

    return `${minutes} min`;
}

function getAverageSessionDuration(sessions) {
    const durations = sessions
        .map((session) => {
            const loginEvent = findTimelineEvent(session, "login") || session.timeline?.[0];
            const logoutEvent = findTimelineEvent(session, "logout");
            const started = parseSessionClock(session, loginEvent?.time);
            const ended = parseSessionClock(session, logoutEvent?.time);

            if (!started || !ended) {
                return null;
            }

            return Math.max(1, Math.round((ended.getTime() - started.getTime()) / 60000));
        })
        .filter((duration) => Number.isFinite(duration));

    if (!durations.length) {
        return "0 min";
    }

    const average = Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length);

    return `${average} min`;
}

function formatSessionClock(session, clock) {
    const parsed = parseSessionClock(session, clock);

    if (!parsed) {
        return null;
    }

    return phDateTime.format(parsed);
}

function parseSessionClock(session, clock) {
    const datePart = session.recordedAt?.split(" ")?.[0];

    if (!datePart || !clock) {
        return null;
    }

    const match = clock.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);

    if (!match) {
        return null;
    }

    let hour = Number(match[1]);
    const minute = match[2];
    const meridiem = match[3].toUpperCase();

    if (meridiem === "PM" && hour !== 12) {
        hour += 12;
    }

    if (meridiem === "AM" && hour === 12) {
        hour = 0;
    }

    const parsed = new Date(`${datePart}T${String(hour).padStart(2, "0")}:${minute}:00+08:00`);

    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function findTimelineEvent(session, keyword) {
    return session.timeline?.find((event) => event.label.toLowerCase().includes(keyword));
}
