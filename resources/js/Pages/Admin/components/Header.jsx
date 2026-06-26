import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, ChevronDown, LogOut, ShieldCheck } from "lucide-react";
import ThemeToggle from "../../Global/ThemeToggle";
import ConfirmDialog from "../../Global/ConfirmDialog";
import Appearance from "../../User/Drawers/Appearance";
import {
    ALERT_SETTINGS_CHANGE_EVENT,
    applySensitivityToAlerts,
    getStoredAlertSensitivity,
    isAlertsEnabled,
} from "../Alerts/utils/alertSensitivity";

const adminUser = {
    firstname: "Health",
    lastname: "Kiosk",
    email: "smcbihealthkiosk@gmail.com",
    role: "admin",
    department: "Clinic",
    barcode: "ADMIN",
};

const notifications = [
    {
        title: "Records updated",
        message: "Recent kiosk readings are available for review.",
        time: "2m ago",
        severity: "Low",
    },
    {
        title: "Devices online",
        message: "All kiosk sensors are currently reachable.",
        time: "18m ago",
        severity: "Medium",
    },
    {
        title: "Alert acknowledged",
        message: "Elevated temperature alert for Juan Dela Cruz was reviewed.",
        time: "1h ago",
        severity: "High",
    },
];

export default function Header({ onLogout, eyebrow = "Admin Dashboard", title = "Health Kiosk Overview" }) {
    const [profileOpen, setProfileOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [logoutOpen, setLogoutOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [appearanceOpen, setAppearanceOpen] = useState(false);
    const [alertsEnabled, setAlertsEnabled] = useState(isAlertsEnabled);
    const [alertSensitivity, setAlertSensitivity] = useState(getStoredAlertSensitivity);

    useEffect(() => {
        const refreshAlertsSetting = () => {
            setAlertsEnabled(isAlertsEnabled());
            setAlertSensitivity(getStoredAlertSensitivity());
        };

        window.addEventListener("storage", refreshAlertsSetting);
        window.addEventListener(ALERT_SETTINGS_CHANGE_EVENT, refreshAlertsSetting);

        return () => {
            window.removeEventListener("storage", refreshAlertsSetting);
            window.removeEventListener(ALERT_SETTINGS_CHANGE_EVENT, refreshAlertsSetting);
        };
    }, []);

    const visibleNotifications = useMemo(() => {
        return alertsEnabled ? applySensitivityToAlerts(notifications, alertSensitivity) : [];
    }, [alertSensitivity, alertsEnabled]);

    const openAppearance = () => {
        setProfileOpen(false);
        setNotificationOpen(false);
        setAppearanceOpen(true);
    };

    const closeMenus = () => {
        setProfileOpen(false);
        setNotificationOpen(false);
    };

    const confirmLogout = async () => {
        if (loggingOut) return;

        setLoggingOut(true);

        try {
            await onLogout?.();
            setLogoutOpen(false);
        } finally {
            setLoggingOut(false);
        }
    };

    return (
        <>
            <header
                className="sticky top-0 z-20 rounded-2xl border p-4 shadow-xl backdrop-blur-xl sm:p-5"
                style={{
                    backgroundColor: "color-mix(in srgb, var(--color-card) 92%, transparent)",
                    borderColor: "var(--color-border)",
                }}
            >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-primary)" }}>
                            {eyebrow}
                        </p>
                        <h1 className="mt-1 text-2xl font-black sm:text-3xl">{title}</h1>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                        <ThemeToggle onClick={openAppearance} />
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    setNotificationOpen((current) => ! current);
                                    setProfileOpen(false);
                                }}
                                className="relative flex h-11 w-11 items-center justify-center rounded-xl border transition hk-soft-hover"
                                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                                aria-label="Notifications"
                                aria-expanded={notificationOpen}
                            >
                                <Bell size={18} />
                                {visibleNotifications.length ? (
                                    <span
                                        className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full"
                                        style={{ backgroundColor: "var(--color-error)", boxShadow: "0 0 0 2px var(--color-card)" }}
                                    />
                                ) : null}
                            </button>

                            <AnimatePresence>
                                {notificationOpen ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                        transition={{ duration: 0.18 }}
                                        className="absolute right-0 top-[calc(100%+0.6rem)] z-30 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl"
                                        style={{
                                            backgroundColor: "color-mix(in srgb, var(--color-card) 96%, transparent)",
                                            borderColor: "var(--color-border)",
                                        }}
                                    >
                                        <div className="border-b px-4 py-3" style={{ borderColor: "var(--color-border)" }}>
                                            <p className="font-black">Admin notifications</p>
                                            <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>
                                                {alertsEnabled ? `${alertSensitivity} sensitivity notification queue` : "Alerts are disabled in Settings"}
                                            </p>
                                        </div>
                                        <div className="max-h-72 space-y-2 overflow-y-auto p-2">
                                            {visibleNotifications.length ? visibleNotifications.map((item) => (
                                                <button
                                                    key={item.title}
                                                    type="button"
                                                    className="w-full rounded-xl p-3 text-left transition hk-soft-hover"
                                                    style={{ backgroundColor: "var(--color-surface)" }}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <p className="text-sm font-black">{item.title}</p>
                                                        <span className="shrink-0 text-[0.65rem] font-bold" style={{ color: "var(--color-muted)" }}>
                                                            {item.time}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-xs leading-5" style={{ color: "var(--color-muted)" }}>
                                                        {item.message}
                                                    </p>
                                                </button>
                                            )) : (
                                                <div className="rounded-xl p-4 text-center" style={{ backgroundColor: "var(--color-surface)" }}>
                                                    <p className="text-sm font-black">No alert notifications</p>
                                                    <p className="mt-1 text-xs leading-5" style={{ color: "var(--color-muted)" }}>
                                                        Enable Alerts in Settings to show abnormal-reading notifications here.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ) : null}
                            </AnimatePresence>
                        </div>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    setProfileOpen((current) => ! current);
                                    setNotificationOpen(false);
                                }}
                                className="flex items-center gap-3 rounded-xl border px-3 py-2 transition hk-soft-hover"
                                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                                aria-expanded={profileOpen}
                            >
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ backgroundColor: "var(--color-primary)" }}>
                                    <ShieldCheck size={18} />
                                </span>
                                <span className="hidden text-left sm:block">
                                    <span className="block text-sm font-black">Health Kiosk</span>
                                    <span className="block text-xs capitalize" style={{ color: "var(--color-muted)" }}>
                                        admin · Clinic
                                    </span>
                                </span>
                                <ChevronDown
                                    size={16}
                                    className="hidden transition-transform sm:block"
                                    style={{ transform: profileOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                                />
                            </button>

                            <AnimatePresence>
                                {profileOpen ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                        transition={{ duration: 0.18 }}
                                        className="absolute right-0 top-[calc(100%+0.6rem)] z-30 w-72 overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl"
                                        style={{
                                            backgroundColor: "color-mix(in srgb, var(--color-card) 94%, transparent)",
                                            borderColor: "var(--color-border)",
                                        }}
                                    >
                                        <div className="border-b p-4" style={{ borderColor: "var(--color-border)" }}>
                                            <p className="font-black">Health Kiosk</p>
                                            <p className="mt-1 truncate text-sm" style={{ color: "var(--color-muted)" }}>
                                                {adminUser.email}
                                            </p>
                                        </div>
                                        <div className="p-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setProfileOpen(false);
                                                    setLogoutOpen(true);
                                                }}
                                                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-black transition hk-danger-hover"
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
            </header>

            {profileOpen || notificationOpen ? (
                <button
                    type="button"
                    aria-label="Close menus"
                    className="fixed inset-0 z-10 cursor-default bg-transparent"
                    onClick={closeMenus}
                />
            ) : null}

            <Appearance open={appearanceOpen} onClose={() => setAppearanceOpen(false)} />
            <ConfirmDialog
                open={logoutOpen}
                title="Log out?"
                message="Your admin session will end and the kiosk will return to login."
                cancelLabel="No, stay"
                confirmLabel={loggingOut ? "Logging out..." : "Log out"}
                onCancel={() => {
                    if (! loggingOut) setLogoutOpen(false);
                }}
                onConfirm={confirmLogout}
            />
        </>
    );
}
