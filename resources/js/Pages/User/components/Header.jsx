import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Bell,
    ChevronDown,
    CheckCheck,
    FileClock,
    HeartPulse,
    LogOut,
    Mail,
    MailOpen,
    UserRound,
} from "lucide-react";
import ThemeToggle from "../../Global/ThemeToggle";
import ConfirmDialog from "../../Global/ConfirmDialog";
import Appearance from "../Drawers/Appearance";
import HealthRecordsDrawer from "../Drawers/HealthRecordsDrawer";
import ProfileDrawer from "../Drawers/ProfileDrawer";
import AssistantToggle from "../AI-Assistant/components/AssistantToggle";
import { useAssistant } from "../AI-Assistant/context/AssistantProvider";

const drawerInitialState = {
    appearance: false,
    profile: false,
    records: false,
};

const accountHintTargets = new Set(["profile", "records", "logout"]);
const notificationItems = [
    {
        id: "devices-ready",
        title: "Available devices ready",
        message: "Heart Rate and SpO2, Temperature, Height, and Weight are ready for use.",
    },
    {
        id: "verification-active",
        title: "Verification active",
        message: "Only verified accounts can continue.",
    },
    {
        id: "heart-guide",
        title: "Heart sensor guide",
        message: "Place your index finger gently and keep your hand still during the reading.",
    },
    {
        id: "weight-guide",
        title: "Weight scale ready",
        message: "Step on the platform with both feet and wait until the value stabilizes.",
    },
    {
        id: "height-guide",
        title: "Height check reminder",
        message: "Stand straight and keep your head level while the kiosk captures height.",
    },
    {
        id: "temperature-guide",
        title: "Temperature reminder",
        message: "Stay at the marked distance and avoid moving until the final value appears.",
    },
    {
        id: "receipt-ready",
        title: "Receipt printing available",
        message: "After completing readings, open Review Results to print your health receipt.",
    },
    {
        id: "session-active",
        title: "Session in progress",
        message: "Complete all available readings before logging out of the kiosk.",
    },
    {
        id: "profile-security",
        title: "Account security",
        message: "Keep your barcode private and update your password when needed.",
    },
    {
        id: "clinic-review",
        title: "Clinic review note",
        message: "Abnormal readings may be reviewed by the clinic administrator.",
    },
];

export default function Header({ user, onLogout, navigate, guidedHint = null }) {
    const { speak } = useAssistant();
    const [clock, setClock] = useState(() => new Date());
    const [profileOpen, setProfileOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [readNotifications, setReadNotifications] = useState(() => new Set());
    const [logoutOpen, setLogoutOpen] = useState(false);
    const [drawers, setDrawers] = useState(drawerInitialState);
    const notificationRef = useRef(null);

    const firstname = user?.firstname || "User";
    const lastname = user?.lastname || "";
    const fullName = `${firstname} ${lastname}`.trim();
    const initials = `${firstname.charAt(0)}${lastname.charAt(0) || ""}`.toUpperCase();
    const email = user?.email || "Email not available";
    const unreadCount = notificationItems.filter((item) => !readNotifications.has(item.id)).length;

    useEffect(() => {
        const timer = window.setInterval(() => setClock(new Date()), 1000);

        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!notificationOpen) return undefined;

        const closeOnOutsideClick = (event) => {
            if (notificationRef.current?.contains(event.target)) return;
            setNotificationOpen(false);
        };
        const closeOnScroll = () => setNotificationOpen(false);

        document.addEventListener("pointerdown", closeOnOutsideClick);
        window.addEventListener("scroll", closeOnScroll, true);

        return () => {
            document.removeEventListener("pointerdown", closeOnOutsideClick);
            window.removeEventListener("scroll", closeOnScroll, true);
        };
    }, [notificationOpen]);

    const openDrawer = (name) => {
        setProfileOpen(false);
        setNotificationOpen(false);
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
    const toggleNotificationRead = (id) => {
        setReadNotifications((current) => {
            const next = new Set(current);

            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;
        });
    };
    const markAllNotifications = (read) => {
        setReadNotifications(read ? new Set(notificationItems.map((item) => item.id)) : new Set());
    };

    return (
        <>
            <header className="relative z-30 mx-auto w-full max-w-7xl">
                <div
                    className="rounded-[2rem] border px-4 py-4 shadow-2xl backdrop-blur-xl sm:px-5"
                    style={{
                        backgroundColor: "color-mix(in srgb, var(--color-card) 88%, transparent)",
                        borderColor: "var(--color-border)",
                        boxShadow: "0 24px 70px color-mix(in srgb, var(--color-text) 10%, transparent)",
                    }}
                >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <button
                            type="button"
                            onClick={() => navigate?.("/user/dashboard")}
                            className="flex min-w-0 items-center gap-4 text-left"
                        >
                            <div
                                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg"
                                style={{ backgroundColor: "var(--color-primary)" }}
                            >
                                <HeartPulse size={27} />
                            </div>

                            <div className="min-w-0">
                                <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-primary)" }}>
                                    Health Kiosk
                                </p>
                                <h1 className="truncate text-2xl font-black">Student and Teacher Access</h1>
                            </div>
                        </button>

                        <div className="flex flex-wrap items-center justify-end gap-3">
                            <div
                                className="rounded-2xl border px-4 py-3 text-sm font-black"
                                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                            >
                                {clock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>

                            <ThemeToggle onClick={() => openDrawer("appearance")} className={guidedHint === "appearance" ? "hk-start-measure-hint" : ""} />
                            <AssistantToggle hinted={guidedHint === "assistant"} />

                            <div className="relative" ref={notificationRef}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNotificationOpen((current) => ! current);
                                        setProfileOpen(false);
                                    }}
                                    className="relative flex h-11 w-11 items-center justify-center rounded-2xl border transition hk-soft-hover"
                                    style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                                    aria-label="Notifications"
                                    aria-expanded={notificationOpen}
                                >
                                    <Bell size={18} />
                                    {unreadCount > 0 ? (
                                        <span
                                            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black text-white"
                                            style={{ backgroundColor: "var(--color-error)" }}
                                        >
                                            {unreadCount}
                                        </span>
                                    ) : null}
                                </button>

                                <AnimatePresence>
                                    {notificationOpen ? (
                                        <motion.div
                                            initial={{ opacity: 0, x: "-50%", y: 12, scale: 0.96 }}
                                            animate={{ opacity: 1, x: "-50%", y: 0, scale: 1 }}
                                            exit={{ opacity: 0, x: "-50%", y: 12, scale: 0.96 }}
                                            transition={{ duration: 0.18 }}
                                            className="absolute left-1/2 top-14 z-50 w-[22rem] overflow-hidden rounded-3xl border p-3 shadow-2xl backdrop-blur-xl"
                                            style={{
                                                backgroundColor: "color-mix(in srgb, var(--color-card) 96%, transparent)",
                                                borderColor: "var(--color-border)",
                                            }}
                                        >
                                            <div className="flex items-start justify-between gap-3 px-2 py-2">
                                                <div>
                                                    <p className="font-black">Notifications</p>
                                                    <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>
                                                        Kiosk updates and clinic alerts.
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => markAllNotifications(unreadCount > 0)}
                                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-2 text-[11px] font-black transition hk-soft-hover"
                                                    style={{
                                                        backgroundColor: "var(--color-surface)",
                                                        borderColor: "var(--color-border)",
                                                        color: "var(--color-text)",
                                                    }}
                                                >
                                                    <CheckCheck size={14} />
                                                    {unreadCount > 0 ? "Read all" : "Unread all"}
                                                </button>
                                            </div>
                                            <div className="mt-2 grid max-h-[17.5rem] gap-2 overflow-y-auto pr-1 hk-scrollbar">
                                                {notificationItems.map((item) => {
                                                    const isRead = readNotifications.has(item.id);
                                                    const StatusIcon = isRead ? MailOpen : Mail;

                                                    return (
                                                        <article
                                                            key={item.id}
                                                            className="rounded-2xl border px-3 py-2.5 transition"
                                                            style={{
                                                                backgroundColor: isRead
                                                                    ? "var(--color-surface)"
                                                                    : "color-mix(in srgb, var(--color-primary) 9%, var(--color-card))",
                                                                borderColor: isRead
                                                                    ? "var(--color-border)"
                                                                    : "color-mix(in srgb, var(--color-primary) 32%, var(--color-border))",
                                                            }}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <div
                                                                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                                                                    style={{
                                                                        backgroundColor: isRead ? "var(--color-card)" : "var(--color-primary)",
                                                                        color: isRead ? "var(--color-muted)" : "#fff",
                                                                    }}
                                                                >
                                                                    <StatusIcon size={15} />
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center gap-2">
                                                                        {!isRead ? (
                                                                            <span
                                                                                className="h-2 w-2 shrink-0 rounded-full"
                                                                                style={{ backgroundColor: "var(--color-primary)" }}
                                                                            />
                                                                        ) : null}
                                                                        <p className="text-sm font-black">{item.title}</p>
                                                                    </div>
                                                                    <p className="mt-0.5 text-xs leading-4" style={{ color: "var(--color-muted)" }}>
                                                                        {item.message}
                                                                    </p>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => toggleNotificationRead(item.id)}
                                                                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-black transition hk-soft-hover"
                                                                        style={{
                                                                            backgroundColor: "var(--color-card)",
                                                                            borderColor: "var(--color-border)",
                                                                            color: "var(--color-text)",
                                                                        }}
                                                                    >
                                                                        {isRead ? <Mail size={13} /> : <MailOpen size={13} />}
                                                                        {isRead ? "Mark as unread" : "Mark as read"}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </article>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    ) : null}
                                </AnimatePresence>
                            </div>

                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setProfileOpen((current) => {
                                            const nextOpen = ! current;
                                            if (nextOpen) {
                                                speak("This is your account menu. Press Health Records to view previous results, view details, and print again.");
                                            }
                                            return nextOpen;
                                        });
                                        setNotificationOpen(false);
                                    }}
                                    className={`flex items-center gap-3 rounded-2xl border px-3 py-2 transition hk-soft-hover ${accountHintTargets.has(guidedHint) ? "hk-start-measure-hint" : ""}`}
                                    style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                                    aria-expanded={profileOpen}
                                >
                                    <span
                                        className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black text-white"
                                        style={{ backgroundColor: "var(--color-success)" }}
                                    >
                                        {initials || "U"}
                                    </span>
                                    <span className="hidden text-left sm:block">
                                        <span className="block text-sm font-black">{fullName}</span>
                                        <span className="block text-xs capitalize" style={{ color: "var(--color-muted)" }}>
                                            {user?.role || "student"} - {user?.department || "COLLEGE"}
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
                                            className="absolute right-0 top-14 w-72 overflow-hidden rounded-3xl border shadow-2xl backdrop-blur-xl"
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
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <Appearance open={drawers.appearance} onClose={() => closeDrawer("appearance")} />
            <ProfileDrawer open={drawers.profile} onClose={() => closeDrawer("profile")} user={user} />
            <HealthRecordsDrawer open={drawers.records} onClose={() => closeDrawer("records")} user={user} />
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
