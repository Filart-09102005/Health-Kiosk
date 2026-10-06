import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createPortal } from "react-dom";
import { ArrowLeft, Bell, CheckCheck, X } from "lucide-react";
import { authService, getErrorMessage } from "../../Auth/services/authService";
import { useToast } from "../../Global/Toast";
import useModalLayer from "../../Global/useModalLayer";
import { useNotifications } from "../utils/notifications";
import NotificationsSkeleton, { NOTIFICATIONS_SKELETON_MIN_MS, NotificationRowSkeleton } from "./components/NotificationsSkeleton";
import Pagination from "../../../Global/TablePagination";

const PAGE_SIZE = 20;

function formatRecordedAt(isoString) {
    if (!isoString) return null;
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return null;

    return {
        date: date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }),
        time: date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
    };
}

function NotificationDetailModal({ item, onClose }) {
    useModalLayer(!!item);
    const recordedAt = formatRecordedAt(item?.created_at);

    const modal = (
        <AnimatePresence>
            {item ? (
                <motion.div
                    className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/65 px-4 backdrop-blur-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default" />

                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        initial={{ opacity: 0, y: 18, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 18, scale: 0.96 }}
                        transition={{ duration: 0.18 }}
                        className="relative z-[9010] w-full max-w-md rounded-[2rem] border p-6 shadow-2xl"
                        style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-xl transition hover:opacity-70"
                            style={{ backgroundColor: "var(--color-surface)", color: "var(--color-muted)" }}
                            aria-label="Close"
                        >
                            <X size={16} />
                        </button>

                        <div
                            className="flex h-12 w-12 items-center justify-center rounded-2xl"
                            style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, var(--color-card))", color: "var(--color-primary)" }}
                        >
                            <Bell size={22} />
                        </div>

                        <h2 className="mt-4 pr-8 text-xl font-black">{item.title}</h2>

                        {recordedAt && (
                            <p className="mt-1 text-xs font-semibold" style={{ color: "var(--color-muted)" }}>
                                {recordedAt.date} &middot; {recordedAt.time}
                            </p>
                        )}

                        <p className="mt-4 text-sm leading-6" style={{ color: "var(--color-text)" }}>
                            {item.message}
                        </p>

                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-6 w-full rounded-2xl px-4 py-3 text-sm font-black transition hover:opacity-90"
                            style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-content)" }}
                        >
                            Got it
                        </button>
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );

    return createPortal(modal, document.body);
}

export default function Notifications({ navigate }) {
    const { showToast } = useToast();
    const shouldReduceMotion = useReducedMotion();
    const { items: notificationItems, unreadCount, loading: fetching, error, markRead, markAllRead } = useNotifications();
    const [holdSkeleton, setHoldSkeleton] = useState(true);
    const [openItem, setOpenItem] = useState(null);
    const [page, setPage] = useState(1);
    const [isPageLoading, setIsPageLoading] = useState(false);

    // The skeleton stays up for a minimum beat so a fast response does not
    // flash it, matching every other screen in the kiosk.
    useEffect(() => {
        const timer = window.setTimeout(() => setHoldSkeleton(false), NOTIFICATIONS_SKELETON_MIN_MS);
        return () => window.clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!error) return;

        showToast({ type: "error", title: "Notifications unavailable", message: getErrorMessage(error) });
        if (error?.response?.status === 401 || error?.response?.status === 403) {
            navigate("/login");
        }
    }, [error, navigate, showToast]);

    const loading = fetching || holdSkeleton;

    const totalPages = Math.max(1, Math.ceil(notificationItems.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pagedItems = notificationItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const handlePageChange = (newPage) => {
        if (newPage === currentPage) return;
        setIsPageLoading(true);
        setPage(newPage);
        window.setTimeout(() => setIsPageLoading(false), 450);
    };

    /**
     * Opening one notification is the only thing that marks it read.
     *
     * Landing on this page used to mark the whole list read, so an alert the
     * user never opened was silently counted as seen.
     */
    const openNotification = (item) => {
        setOpenItem(item);
        markRead(item.id);
    };

    /**
     * Return to the screen the bell was pressed on.
     *
     * The router records where each navigation came from, so this goes back to
     * the measurement flow or the health summary instead of always dropping the
     * user on the dashboard. Falls back to the dashboard when this page was
     * opened directly by URL and there is no in-app history to return to.
     */
    const goBack = () => {
        const from = window.history.state?.from;

        if (from && from !== "/user/notifications") {
            window.history.back();
            return;
        }

        navigate("/user/dashboard");
    };

    if (loading) {
        return <NotificationsSkeleton />;
    }

    return (
        <main
            className="flex h-[100dvh] flex-col overflow-hidden px-4 py-6"
            style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
        >
            <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col">
                <motion.section
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="flex shrink-0 items-center justify-between gap-3 rounded-[2rem] border p-6 shadow-2xl md:p-8"
                    style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                >
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={goBack}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition hk-soft-hover"
                            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                            aria-label="Go back"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-black">Notifications</h2>
                                {/* The count stays on screen for as long as anything is
                                    unread, so it never has to be inferred from the list. */}
                                {unreadCount > 0 ? (
                                    <span
                                        className="flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-black"
                                        style={{ backgroundColor: "var(--color-error)", color: "var(--color-error-content)" }}
                                    >
                                        {unreadCount}
                                    </span>
                                ) : null}
                            </div>
                            <p className="mt-0.5 text-xs font-semibold" style={{ color: "var(--color-muted)" }}>
                                {unreadCount > 0
                                    ? `${unreadCount} unread of ${notificationItems.length}`
                                    : `All caught up · ${notificationItems.length} total`}
                            </p>
                        </div>
                    </div>

                    {unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={markAllRead}
                            className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-black transition hk-soft-hover"
                            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-primary)" }}
                        >
                            <CheckCheck size={16} />
                            Mark all read
                        </button>
                    )}
                </motion.section>

                <motion.section
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: shouldReduceMotion ? 0 : 0.05 }}
                    className="mt-5 flex min-h-0 flex-1 flex-col rounded-[2rem] border p-6 shadow-2xl md:p-8"
                    style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                >
                    {/* The only thing on the page that scrolls. */}
                    <div className="hk-slim-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
                        {notificationItems.length === 0 ? (
                            <div className="rounded-2xl border p-8 text-center text-sm font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>
                                You have no notifications right now.
                            </div>
                        ) : isPageLoading ? (
                            Array.from({ length: Math.min(PAGE_SIZE, notificationItems.length) }).map((_, idx) => (
                                <NotificationRowSkeleton key={`skeleton-${idx}`} index={idx} />
                            ))
                        ) : (
                            pagedItems.map((item) => {
                                const isRead = item.read;
                                const recordedAt = formatRecordedAt(item.created_at);

                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => openNotification(item)}
                                        className="flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left transition hover:opacity-90"
                                        style={{
                                            backgroundColor: isRead ? "var(--color-surface)" : "color-mix(in srgb, var(--color-primary) 6%, var(--color-card))",
                                            borderColor: "var(--color-border)",
                                        }}
                                    >
                                        <span
                                            className="h-2 w-2 shrink-0 rounded-full"
                                            style={{ backgroundColor: isRead ? "transparent" : "var(--color-primary)" }}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-baseline justify-between gap-3">
                                                <p className="truncate text-sm" style={{ color: "var(--color-text)", fontWeight: isRead ? 500 : 700 }}>
                                                    {item.title}
                                                </p>
                                                {recordedAt && (
                                                    <span className="shrink-0 text-[0.7rem] font-semibold" style={{ color: "var(--color-muted)" }}>
                                                        {recordedAt.date} &middot; {recordedAt.time}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="truncate text-xs leading-5" style={{ color: "var(--color-muted)" }}>
                                                {item.message}
                                            </p>
                                        </div>
                                        <span className="shrink-0 text-xs" style={{ color: "var(--color-muted)" }}>›</span>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-6 flex shrink-0 items-center justify-between gap-3 border-t pt-5" style={{ borderColor: "var(--color-border)" }}>
                            <Pagination page={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                        </div>
                    )}
                </motion.section>
            </div>

            <NotificationDetailModal item={openItem} onClose={() => setOpenItem(null)} />
        </main>
    );
}
