import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Bell,
    ChevronDown,
    FileClock,
    HeartPulse,
    LogOut,
    UserRound,
} from "lucide-react";
import ThemeToggle from "../../Global/ThemeToggle";
import ConfirmDialog from "../../Global/ConfirmDialog";
import Appearance from "../Drawers/Appearance";
import HealthRecordsDrawer from "../Drawers/HealthRecordsDrawer";
import ProfileDrawer from "../Drawers/ProfileDrawer";
import AssistantToggle from "../AI-Assistant/components/AssistantToggle";
import { useAssistant } from "../AI-Assistant/context/AssistantProvider";
import { useNotifications } from "../utils/notifications";
import { getDisplayName, getInitials } from "../../../Global/userIdentity";

const drawerInitialState = {
    appearance: false,
    profile: false,
    records: false,
};

const accountHintTargets = new Set(["profile", "records", "logout"]);

const NOTIFICATION_POPUP_MS = 5000;

// Persisted in sessionStorage (not a ref) so the "already popped up" set
// survives Header remounting on every page navigation — otherwise the same
// alert would auto-popup again each time the user changed pages, since a
// fresh useRef(new Set()) forgets everything the previous Header instance saw.
function shownPopupStorageKey(userId) {
    return `hk_shown_notification_ids_${userId || "guest"}`;
}

function loadShownPopupIds(userId) {
    try {
        const raw = window.sessionStorage.getItem(shownPopupStorageKey(userId));
        return new Set(raw ? JSON.parse(raw) : []);
    } catch {
        return new Set();
    }
}

function persistShownPopupIds(userId, ids) {
    try {
        window.sessionStorage.setItem(shownPopupStorageKey(userId), JSON.stringify([...ids]));
    } catch {
        // Ignore storage errors (private browsing, quota, etc.) — worst case
        // a notification pops up again, which is harmless.
    }
}

export default function Header({ user, onLogout, navigate, guidedHint = null, showNotificationBell = true }) {
    // Read from the server rather than recomputed from whatever this page holds,
    // so the badge is the same number on every screen and survives a logout.
    const { items: notificationItems, unreadCount } = useNotifications();
    const { speak } = useAssistant();
    const [clock, setClock] = useState(() => new Date());
    const [profileOpen, setProfileOpen] = useState(false);
    const [popupQueue, setPopupQueue] = useState([]);
    const [autoPopup, setAutoPopup] = useState(null);
    const [logoutOpen, setLogoutOpen] = useState(false);
    const [drawers, setDrawers] = useState(drawerInitialState);
    const shownPopupIds = useRef(loadShownPopupIds(user?.id));

    // `user` arrives from a page-level fetch that does not re-run when the
    // profile is edited, so a save would leave this header showing the old
    // name until a reload. The drawer reports what it saved and we layer it on
    // top. Applied here rather than in each page because every screen that
    // renders Header has the same stale-prop problem.
    const [profilePatch, setProfilePatch] = useState(null);

    // A different account means the patch belongs to someone else.
    useEffect(() => { setProfilePatch(null); }, [user?.id]);

    const activeUser = useMemo(
        () => (profilePatch ? { ...user, ...profilePatch } : user),
        [user, profilePatch],
    );

    const fullName = getDisplayName(activeUser, "Your Account");
    const initials = getInitials(activeUser);
    const email = activeUser?.email || "Email not available";
    useEffect(() => {
        const timer = window.setInterval(() => setClock(new Date()), 1000);

        return () => window.clearInterval(timer);
    }, []);

    // Queue any unread notification we haven't already popped up this session.
    useEffect(() => {
        const unseen = notificationItems.filter((item) => !item.read && !shownPopupIds.current.has(item.id));
        if (unseen.length === 0) return;

        unseen.forEach((item) => shownPopupIds.current.add(item.id));
        persistShownPopupIds(user?.id, shownPopupIds.current);
        setPopupQueue((current) => [...current, ...unseen]);
    }, [notificationItems, user?.id]);

    // Pull the next queued notification into view once the current one clears.
    useEffect(() => {
        if (autoPopup || popupQueue.length === 0) return;

        setAutoPopup(popupQueue[0]);
        setPopupQueue((current) => current.slice(1));
    }, [autoPopup, popupQueue]);

    // Auto-hide the visible popup after a fixed duration.
    useEffect(() => {
        if (!autoPopup) return undefined;

        const timer = window.setTimeout(() => setAutoPopup(null), NOTIFICATION_POPUP_MS);
        return () => window.clearTimeout(timer);
    }, [autoPopup]);

    const goToNotifications = () => {
        setAutoPopup(null);
        setProfileOpen(false);
        navigate?.("/user/notifications");
    };

    const openDrawer = (name) => {
        setProfileOpen(false);
        if (name === "records") {
            speak("Opening Health Records. You can view previous health check details and print a receipt again if needed.");
        }
        if (name === "profile") {
            speak("Opening your profile. You can review your account information here.");
        }
        if (name === "appearance") {
            speak("Opening Appearance. You can change the kiosk display theme, including light mode and dark mode.");
        }
        setDrawers((current) => ({ ...current, [name]: true }));
    };

    const closeDrawer = (name) => {
        setDrawers((current) => ({ ...current, [name]: false }));
    };

    const menuItems = [
        { label: "Profile", icon: UserRound, hint: "profile", action: () => openDrawer("profile") },
        { label: "Health Records", icon: FileClock, hint: "records", action: () => openDrawer("records") },
    ];

    return (
        <>
            <header className="relative z-30 mx-auto w-full max-w-7xl">
                <div
                    className="rounded-[1.5rem] border px-2.5 py-2.5 shadow-2xl backdrop-blur-xl sm:rounded-[2rem] sm:px-4 sm:py-4 md:px-5"
                    style={{
                        backgroundColor: "color-mix(in srgb, var(--color-card) 88%, transparent)",
                        borderColor: "var(--color-border)",
                        boxShadow: "0 24px 70px color-mix(in srgb, var(--color-text) 10%, transparent)",
                    }}
                >
                    <div className="flex flex-row flex-nowrap items-center justify-between gap-2 sm:gap-4">
                        <button
                            type="button"
                            onClick={() => navigate?.("/user/dashboard")}
                            className="flex min-w-0 items-center gap-2 text-left sm:gap-4"
                        >
                            <div
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-lg sm:h-12 sm:w-12 sm:rounded-2xl md:h-14 md:w-14"
                                style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-content)" }}
                            >
                                <HeartPulse size={18} className="sm:hidden" />
                                <HeartPulse size={24} className="hidden sm:block md:hidden" />
                                <HeartPulse size={27} className="hidden md:block" />
                            </div>

                            <div className="min-w-0">
                                <p className="hidden text-xs font-black uppercase tracking-[0.18em] sm:block" style={{ color: "var(--color-primary)" }}>
                                    Health Kiosk
                                </p>
                                <h1 className="truncate text-base font-black sm:text-xl md:text-2xl">Student and Teacher Access</h1>
                            </div>
                        </button>

                        <div className="flex flex-nowrap shrink-0 items-center justify-end gap-1.5 sm:gap-3">
                            <div
                                className="rounded-xl border px-2 py-1.5 text-xs font-black sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
                                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                            >
                                {clock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>

                            <ThemeToggle onClick={() => openDrawer("appearance")} className={`hk-header-toggle ${guidedHint === "appearance" ? "hk-start-measure-hint" : ""}`} />
                            <AssistantToggle hinted={guidedHint === "assistant"} className="hk-header-toggle" />

                            {/* ── Bell + Profile group (single relative container so notification dropdown right-anchors to the group edge) ── */}
                            <div className="relative flex items-center gap-1.5 sm:gap-3">

                                {/* Bell — now a direct link into the Notifications page (no dropdown).
                                    Hidden entirely on the Notifications page itself via showNotificationBell. */}
                                {showNotificationBell && (
                                <div className="relative">

                                <button
                                    type="button"
                                    onClick={goToNotifications}
                                    className="relative flex h-9 w-9 items-center justify-center rounded-xl border transition hk-soft-hover sm:h-11 sm:w-11 sm:rounded-2xl"
                                    style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                                    aria-label="Notifications"
                                >
                                    <Bell size={16} className="sm:hidden" />
                                    <Bell size={18} className="hidden sm:block" />
                                    {unreadCount > 0 ? (
                                        <span
                                            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black"
                                            style={{ backgroundColor: "var(--color-error)", color: "var(--color-error-content)" }}
                                        >
                                            {unreadCount}
                                        </span>
                                    ) : null}
                                </button>

                                {/* Auto-popup: appears when a new alert exists, hides itself after
                                    NOTIFICATION_POPUP_MS, and clicking it jumps to the full Notifications page. */}
                                <AnimatePresence>
                                    {autoPopup ? (
                                        <>
                                            {/* Caret is anchored directly to the bell (this wrapper is exactly
                                                the bell's own size), centered under it — independent of
                                                wherever the box below is shifted, so they can never drift
                                                out of sync with each other again. */}
                                            <span
                                                aria-hidden="true"
                                                className="absolute left-1/2 top-full z-50 mt-[5px] h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t"
                                                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                                            />
                                            <motion.button
                                                key={autoPopup.id}
                                                type="button"
                                                onClick={goToNotifications}
                                                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                                transition={{ duration: 0.18 }}
                                                className="absolute right-[-1rem] top-full z-50 mt-3 w-72 rounded-lg border p-3.5 text-left shadow-2xl transition hover:opacity-90"
                                                style={{
                                                    backgroundColor: "var(--color-card)",
                                                    borderColor: "var(--color-border)",
                                                }}
                                            >
                                                <p className="text-sm font-bold" style={{ color: "var(--color-text)" }}>{autoPopup.title}</p>
                                                <p className="mt-1.5 text-xs leading-5" style={{ color: "var(--color-muted)" }}>{autoPopup.message}</p>
                                            </motion.button>
                                        </>
                                    ) : null}
                                </AnimatePresence>
                                </div>
                                )}{/* /Bell */}

                                {/* Profile */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setProfileOpen((current) => {
                                                const nextOpen = !current;
                                                if (nextOpen) {
                                                    speak("This is your account menu. Press Health Records to view previous results, view details, and print again.");
                                                }
                                                return nextOpen;
                                            });
                                            setAutoPopup(null);
                                        }}
                                        className={`flex items-center gap-2 rounded-xl border px-2 py-1.5 transition hk-soft-hover sm:gap-3 sm:rounded-2xl sm:px-3 sm:py-2 ${accountHintTargets.has(guidedHint) ? "hk-start-measure-hint" : ""}`}
                                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                                        aria-expanded={profileOpen}
                                    >
                                        <span
                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black sm:h-9 sm:w-9 sm:rounded-xl sm:text-sm"
                                            style={{ backgroundColor: "var(--color-success)", color: "var(--color-success-content)" }}
                                        >
                                            {initials || "U"}
                                        </span>
                                        <span className="hidden text-left sm:block">
                                            <span className="block text-sm font-black">{fullName}</span>
                                            <span className="block text-xs capitalize" style={{ color: "var(--color-muted)" }}>
                                                {activeUser?.role || "student"} - {activeUser?.department || "COLLEGE"}
                                            </span>
                                        </span>
                                        <ChevronDown size={16} />
                                    </button>

                                    <AnimatePresence>
                                        {profileOpen ? (
                                            <motion.div
                                                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 12, scale: 0.96 }}
                                                transition={{ duration: 0.18 }}
                                                className="absolute right-0 top-full mt-2 w-72 overflow-hidden rounded-3xl border shadow-2xl backdrop-blur-xl"
                                                style={{
                                                    backgroundColor: "color-mix(in srgb, var(--color-card) 94%, transparent)",
                                                    borderColor: "var(--color-border)",
                                                }}
                                            >
                                                <div className="border-b p-4" style={{ borderColor: "var(--color-border)" }}>
                                                    <p className="font-black">{fullName}</p>
                                                    <p className="mt-1 truncate text-sm" style={{ color: "var(--color-muted)" }}>
                                                        {email}
                                                    </p>
                                                </div>

                                                <div className="p-2">
                                                    {menuItems.map((item) => {
                                                        const Icon = item.icon;
                                                        return (
                                                            <button
                                                                key={item.label}
                                                                type="button"
                                                                onClick={item.action}
                                                                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold transition hk-soft-hover ${guidedHint === item.hint ? "hk-flow-action-hint" : ""}`}
                                                                style={{ color: "var(--color-text)" }}
                                                            >
                                                                <Icon size={17} style={{ color: "var(--color-muted)" }} />
                                                                {item.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                <div className="border-t p-2" style={{ borderColor: "var(--color-border)" }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setProfileOpen(false);
                                                            setLogoutOpen(true);
                                                        }}
                                                        className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-black transition hk-danger-hover ${guidedHint === "logout" ? "hk-flow-action-hint" : ""}`}
                                                        style={{ color: "var(--color-error)" }}
                                                    >
                                                        <LogOut size={17} />
                                                        Logout
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ) : null}
                                    </AnimatePresence>
                                </div>{/* /Profile */}

                            </div>{/* /Bell+Profile group */}
                        </div>{/* /flex-wrap actions */}
                    </div>{/* /flex-col header row */}
                </div>{/* /rounded card */}
            </header>

            <Appearance open={drawers.appearance} onClose={() => closeDrawer("appearance")} />
            <ProfileDrawer
                open={drawers.profile}
                onClose={() => closeDrawer("profile")}
                user={activeUser}
                onUpdated={(saved) => setProfilePatch((current) => ({ ...current, ...saved }))}
            />
            <HealthRecordsDrawer open={drawers.records} onClose={() => closeDrawer("records")} user={activeUser} />
            <ConfirmDialog
                open={logoutOpen}
                title="Log out?"
                message="Your kiosk session will end and you will return to the login screen."
                cancelLabel="No, stay"
                confirmLabel="Log out"
                onCancel={() => setLogoutOpen(false)}
                onConfirm={() => {
                    speak("logout");
                    onLogout?.();
                }}
            />
        </>
    );
}
