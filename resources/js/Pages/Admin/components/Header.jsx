import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, ChevronDown, CloudUpload, LogOut, ShieldCheck } from "lucide-react";
import ThemeToggle from "../../Global/ThemeToggle";
import ConfirmDialog from "../../Global/ConfirmDialog";
import Appearance from "../../User/Drawers/Appearance";
import { authService, getErrorMessage } from "../../Auth/services/authService";
import { useToast } from "../../Global/Toast";
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
    const { showToast } = useToast();
    const [profileOpen, setProfileOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [logoutOpen, setLogoutOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [appearanceOpen, setAppearanceOpen] = useState(false);
    const [alertsEnabled, setAlertsEnabled] = useState(isAlertsEnabled);
    const [alertSensitivity, setAlertSensitivity] = useState(getStoredAlertSensitivity);
    const [syncingCloud, setSyncingCloud] = useState(false);

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

    const notify = (toast) => {
        if (typeof showToast === "function") {
            showToast(toast);
            return;
        }

        window.alert(`${toast.title}${toast.message ? `\n${toast.message}` : ""}`);
    };

    const syncCloudData = async (event) => {
        event?.preventDefault();
        event?.stopPropagation();
        console.log("Sync Cloud clicked");

        if (syncingCloud) return;

        setSyncingCloud(true);
        notify({
            type: "info",
            title: "Syncing kiosk data to cloud...",
            message: "Uploading users and health records to Supabase.",
        });

        try {
            const response = await authService.syncAdminUsersToCloud();
            const userSyncedCount = response.data?.users?.synced_count ?? 0;
            const healthRecordSyncedCount = response.data?.health_records?.synced_count ?? 0;
            const failedCount = response.data?.failed_count ?? 0;
            const success = response.data?.success !== false;
            const firstError = response.data?.errors?.[0]?.error || response.data?.error || response.data?.message;
            const syncedMessage = [
                userSyncedCount > 0 ? `${userSyncedCount} users` : null,
                healthRecordSyncedCount > 0 ? `${healthRecordSyncedCount} health records` : null,
            ].filter(Boolean).join(" and ");

            notify({
                type: ! success || failedCount > 0 ? "warning" : "success",
                title: ! success || failedCount > 0 ? "Cloud sync completed with issues" : "Cloud sync completed.",
                message: syncedMessage
                    ? `Synced ${syncedMessage} to Supabase.${failedCount > 0 ? ` ${failedCount} failed.` : ""}`
                    : failedCount > 0
                        ? `Cloud sync failed: ${firstError || "Please check your Supabase connection."}`
                        : "No users or health records need syncing.",
            });
        } catch (error) {
            const message = getErrorMessage(error, "Cloud sync failed. Please check your Supabase connection.");

            notify({
                type: "error",
                title: "Cloud sync failed",
                message: `Cloud sync failed: ${message}`,
            });
        } finally {
            setSyncingCloud(false);
        }
    };

    return (
        <>
            <header
                className="sticky top-0 z-40 mb-2 rounded-[2rem] border px-4 py-3 sm:px-6 sm:py-4 transition-all"
                style={{
                    backgroundColor: "color-mix(in srgb, var(--color-card) 35%, transparent)",
                    borderColor: "color-mix(in srgb, var(--color-border) 20%, transparent)",
                    backdropFilter: "blur(32px) saturate(200%)",
                    WebkitBackdropFilter: "blur(32px) saturate(200%)",
                    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px color-mix(in srgb, var(--color-text) 15%, transparent), inset 0 0 0 1px color-mix(in srgb, var(--color-card) 20%, transparent)",
                }}
            >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                        <div 
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.15rem] text-white shadow-lg"
                            style={{ 
                                background: "linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 60%, black))",
                                boxShadow: "0 8px 20px -6px color-mix(in srgb, var(--color-primary) 80%, transparent)"
                            }}
                        >
                            <ShieldCheck size={24} />
                        </div>
                        <div className="flex flex-col justify-center">
                            {eyebrow && (
                                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] leading-none" style={{ color: "var(--color-primary)" }}>
                                    {eyebrow}
                                </p>
                            )}
                            <h1 className="text-xl font-black tracking-tight leading-none sm:text-2xl">{title}</h1>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                        <div 
                            className="flex items-center gap-1.5 rounded-[1.25rem] border p-1.5 shadow-sm"
                            style={{ 
                                backgroundColor: "color-mix(in srgb, var(--color-surface) 20%, transparent)", 
                                borderColor: "color-mix(in srgb, var(--color-border) 30%, transparent)",
                                backdropFilter: "blur(16px)",
                                WebkitBackdropFilter: "blur(16px)",
                            }}
                        >
                            <div className="px-1">
                                <ThemeToggle onClick={openAppearance} />
                            </div>
                            
                            <div className="h-6 w-px mx-1" style={{ backgroundColor: "color-mix(in srgb, var(--color-border) 80%, transparent)" }} />

                            <div className="relative">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    type="button"
                                    onClick={() => {
                                        setNotificationOpen((current) => ! current);
                                        setProfileOpen(false);
                                    }}
                                    className="relative flex h-10 w-10 items-center justify-center rounded-[1rem] transition-colors"
                                    style={{ 
                                        backgroundColor: notificationOpen ? "var(--color-primary)" : "transparent", 
                                        color: notificationOpen ? "#fff" : "inherit" 
                                    }}
                                    aria-label="Notifications"
                                    aria-expanded={notificationOpen}
                                >
                                    <Bell size={18} />
                                    {visibleNotifications.length ? (
                                        <>
                                            <span
                                                className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full z-10"
                                                style={{ 
                                                    backgroundColor: "var(--color-error)", 
                                                    boxShadow: `0 0 0 2px ${notificationOpen ? "var(--color-primary)" : "var(--color-surface)"}` 
                                                }}
                                            />
                                            <span 
                                                className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full animate-ping opacity-75"
                                                style={{ backgroundColor: "var(--color-error)" }}
                                            />
                                        </>
                                    ) : null}
                                </motion.button>

                                <AnimatePresence>
                                    {notificationOpen ? (
                                        <motion.div
                                            initial={{ opacity: 0, x: "-50%", y: 15, scale: 0.95 }}
                                            animate={{ opacity: 1, x: "-50%", y: 0, scale: 1 }}
                                            exit={{ opacity: 0, x: "-50%", y: 10, scale: 0.95 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            className="absolute left-1/2 top-[calc(100%+0.75rem)] z-30 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[1.5rem] border shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]"
                                            style={{
                                                backgroundColor: "var(--color-card)",
                                                borderColor: "var(--color-border)",
                                            }}
                                        >
                                            <div className="border-b px-5 py-4" style={{ borderColor: "var(--color-border)" }}>
                                                <p className="font-black text-lg">Notifications</p>
                                                <p className="mt-1 text-xs font-medium" style={{ color: "var(--color-muted)" }}>
                                                    {alertsEnabled ? `${alertSensitivity} sensitivity notification queue` : "Alerts are disabled in Settings"}
                                                </p>
                                            </div>
                                            <div className="max-h-[22rem] space-y-1.5 overflow-y-auto p-2">
                                                {visibleNotifications.length ? visibleNotifications.map((item) => (
                                                    <motion.button
                                                        whileHover={{ scale: 0.98 }}
                                                        whileTap={{ scale: 0.96 }}
                                                        key={item.title}
                                                        type="button"
                                                        className="w-full rounded-[1rem] p-3.5 text-left transition-colors"
                                                        style={{ backgroundColor: "var(--color-surface)" }}
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <p className="text-sm font-bold">{item.title}</p>
                                                            <span className="shrink-0 text-[0.65rem] font-bold uppercase tracking-wider" style={{ color: "var(--color-primary)" }}>
                                                                {item.time}
                                                            </span>
                                                        </div>
                                                        <p className="mt-1.5 text-xs font-medium leading-relaxed" style={{ color: "var(--color-muted)" }}>
                                                            {item.message}
                                                        </p>
                                                    </motion.button>
                                                )) : (
                                                    <div className="rounded-[1rem] p-6 text-center" style={{ backgroundColor: "var(--color-surface)" }}>
                                                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-black/5 text-black/20 dark:bg-white/5 dark:text-white/20">
                                                            <Bell size={24} />
                                                        </div>
                                                        <p className="text-sm font-black">All caught up!</p>
                                                        <p className="mt-1.5 text-xs font-medium leading-relaxed" style={{ color: "var(--color-muted)" }}>
                                                            Enable Alerts in Settings to show abnormal-reading notifications here.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ) : null}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="relative">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="button"
                                onClick={() => {
                                    setProfileOpen((current) => ! current);
                                    setNotificationOpen(false);
                                }}
                                className="flex items-center gap-3 rounded-[1.25rem] border p-1.5 pr-4 shadow-sm transition-colors"
                                style={{ 
                                    backgroundColor: profileOpen ? "color-mix(in srgb, var(--color-surface) 40%, transparent)" : "color-mix(in srgb, var(--color-surface) 20%, transparent)", 
                                    borderColor: profileOpen ? "color-mix(in srgb, var(--color-border) 40%, transparent)" : "color-mix(in srgb, var(--color-border) 30%, transparent)",
                                    backdropFilter: "blur(16px)",
                                    WebkitBackdropFilter: "blur(16px)",
                                }}
                                aria-expanded={profileOpen}
                            >
                                <span 
                                    className="flex h-10 w-10 items-center justify-center rounded-[1rem] text-white shadow-md" 
                                    style={{ 
                                        background: "linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 70%, black))" 
                                    }}
                                >
                                    <ShieldCheck size={18} />
                                </span>
                                <span className="hidden text-left sm:block">
                                    <span className="block text-sm font-black tracking-tight">Health Kiosk</span>
                                    <span className="block text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--color-primary)" }}>
                                        Admin
                                    </span>
                                </span>
                                <ChevronDown
                                    size={16}
                                    className="hidden transition-transform sm:block opacity-60"
                                    style={{ transform: profileOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                                />
                            </motion.button>

                            <AnimatePresence>
                                {profileOpen ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-72 overflow-hidden rounded-[1.5rem] border shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]"
                                        style={{
                                            backgroundColor: "var(--color-card)",
                                            borderColor: "var(--color-border)",
                                        }}
                                    >
                                        <div className="border-b px-5 py-4" style={{ borderColor: "var(--color-border)" }}>
                                            <p className="font-black text-lg">Administrator</p>
                                            <p className="mt-1 truncate text-xs font-medium" style={{ color: "var(--color-muted)" }}>
                                                {adminUser.email}
                                            </p>
                                        </div>
                                        <div className="p-2 space-y-1">
                                            <motion.button
                                                whileHover={{ scale: 0.98 }}
                                                whileTap={{ scale: 0.96 }}
                                                type="button"
                                                onClick={syncCloudData}
                                                disabled={syncingCloud}
                                                className="flex w-full items-center gap-3 rounded-[1rem] px-4 py-3.5 text-left text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                                                style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
                                            >
                                                <CloudUpload size={18} style={{ color: "var(--color-primary)" }} />
                                                {syncingCloud ? "Syncing data..." : "Sync Users & Records"}
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 0.98 }}
                                                whileTap={{ scale: 0.96 }}
                                                type="button"
                                                onClick={() => {
                                                    setProfileOpen(false);
                                                    setLogoutOpen(true);
                                                }}
                                                className="flex w-full items-center gap-3 rounded-[1rem] px-4 py-3.5 text-left text-sm font-bold transition-colors"
                                                style={{ backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)", color: "var(--color-error)" }}
                                            >
                                                <LogOut size={18} />
                                                Log Out Securely
                                            </motion.button>
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
