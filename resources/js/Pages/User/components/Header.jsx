import { useEffect, useState } from "react";
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

const drawerInitialState = {
    appearance: false,
    profile: false,
    records: false,
};

const accountHintTargets = new Set(["profile", "records", "logout"]);

export default function Header({ user, onLogout, navigate, guidedHint = null }) {
    const { speak } = useAssistant();
    const [clock, setClock] = useState(() => new Date());
    const [profileOpen, setProfileOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [logoutOpen, setLogoutOpen] = useState(false);
    const [drawers, setDrawers] = useState(drawerInitialState);

    const firstname = user?.firstname || "User";
    const lastname = user?.lastname || "";
    const fullName = `${firstname} ${lastname}`.trim();
    const initials = `${firstname.charAt(0)}${lastname.charAt(0) || ""}`.toUpperCase();
    const email = user?.email || "Email not available";

    useEffect(() => {
        const timer = window.setInterval(() => setClock(new Date()), 1000);

        return () => window.clearInterval(timer);
    }, []);

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
                            <AssistantToggle />

                            <div className="relative">
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
                                    <span
                                        className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full"
                                        style={{ backgroundColor: "var(--color-error)" }}
                                    />
                                </button>

                                <AnimatePresence>
                                    {notificationOpen ? (
                                        <motion.div
                                            initial={{ opacity: 0, x: "-50%", y: 12, scale: 0.96 }}
                                            animate={{ opacity: 1, x: "-50%", y: 0, scale: 1 }}
                                            exit={{ opacity: 0, x: "-50%", y: 12, scale: 0.96 }}
                                            transition={{ duration: 0.18 }}
                                            className="absolute left-1/2 top-14 w-80 overflow-hidden rounded-3xl border p-3 shadow-2xl backdrop-blur-xl"
                                            style={{
                                                backgroundColor: "color-mix(in srgb, var(--color-card) 96%, transparent)",
                                                borderColor: "var(--color-border)",
                                            }}
                                        >
                                            <div className="px-2 py-2">
                                                <p className="font-black">Notifications</p>
                                                <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>
                                                    Kiosk updates and clinic alerts.
                                                </p>
                                            </div>
                                            {[
                                                ["Sensors ready", "All measurement devices are standing by."],
                                                ["Verification active", "Only verified accounts can continue."],
                                            ].map(([title, message]) => (
                                                <div key={title} className="mt-2 rounded-2xl p-3" style={{ backgroundColor: "var(--color-surface)" }}>
                                                    <p className="text-sm font-black">{title}</p>
                                                    <p className="mt-1 text-xs leading-5" style={{ color: "var(--color-muted)" }}>
                                                        {message}
                                                    </p>
                                                </div>
                                            ))}
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
