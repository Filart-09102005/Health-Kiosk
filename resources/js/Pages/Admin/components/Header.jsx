import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, CloudUpload, LogOut, Menu, ShieldCheck } from "lucide-react";
import ThemeToggle from "../../Global/ThemeToggle";
import ConfirmDialog from "../../Global/ConfirmDialog";
import Appearance from "../../User/Drawers/Appearance";
import { authService, getErrorMessage } from "../../Auth/services/authService";
import { getDisplayName } from "../../../Global/userIdentity";
import { useToast } from "../../Global/Toast";

export default function Header({ onLogout, eyebrow = "Admin Dashboard", title = "Health Kiosk Overview", onOpenMobileNav }) {
    const { showToast } = useToast();
    const [adminUser, setAdminUser] = useState(null);
    const [profileOpen, setProfileOpen] = useState(false);
    const [logoutOpen, setLogoutOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [appearanceOpen, setAppearanceOpen] = useState(false);
    const [syncingCloud, setSyncingCloud] = useState(false);

    useEffect(() => {
        let alive = true;

        authService.currentUser()
            .then((response) => {
                const user = response.data?.user || response.data;

                if (!alive || !user) return;

                setAdminUser(user);
            })
            .catch(() => {
                if (!alive) return;
            });

        return () => {
            alive = false;
        };
    }, []);

    const adminDisplayName = useMemo(
        () => (adminUser ? getDisplayName(adminUser, "Administrator") : "Administrator"),
        [adminUser],
    );

    const openAppearance = () => {
        setProfileOpen(false);
        setAppearanceOpen(true);
    };

    const closeMenus = () => {
        setProfileOpen(false);
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

        if (syncingCloud) return;

        setSyncingCloud(true);
        notify({
            type: "info",
            title: "Syncing kiosk data to cloud...",
            message: "Re-uploading every user and health record to Supabase.",
        });

        try {
            const response = await authService.syncAdminUsersToCloud();
            const userSyncedCount = response.data?.users?.synced_count ?? 0;
            const syncedNames = response.data?.users?.synced_names ?? [];
            const healthRecordSyncedCount = response.data?.health_records?.synced_count ?? 0;
            const failedCount = response.data?.failed_count ?? 0;
            const success = response.data?.success !== false;
            const firstError = response.data?.errors?.[0]?.error || response.data?.error || response.data?.message;

            // Names of the synced users, not just a count - shown alongside
            // the "N users" total so an admin can see who actually went up
            // without opening the log.
            const namesPreview = syncedNames.length
                ? ` (${syncedNames.slice(0, 5).join(", ")}${syncedNames.length > 5 ? `, +${syncedNames.length - 5} more` : ""})`
                : "";

            const syncedMessage = [
                userSyncedCount > 0 ? `${userSyncedCount} users${namesPreview}` : null,
                healthRecordSyncedCount > 0 ? `${healthRecordSyncedCount} health records` : null,
            ].filter(Boolean).join(" and ");

            // Everything is re-sent now, so 0 synced means there is genuinely
            // nothing here — not that the flags said it had already gone up.
            // "No users or health records need syncing" used to appear while the
            // Supabase table sat empty, because a row deleted in the dashboard
            // still looked synced locally.
            const nothingToSend = userSyncedCount === 0 && healthRecordSyncedCount === 0 && failedCount === 0;

            notify({
                type: ! success || failedCount > 0 ? "warning" : "success",
                title: ! success || failedCount > 0 ? "Cloud sync completed with issues" : "Cloud sync completed.",
                message: syncedMessage
                    ? `Supabase now holds ${syncedMessage} from this kiosk.${failedCount > 0 ? ` ${failedCount} failed.` : ""}`
                    : failedCount > 0
                        ? `Cloud sync failed: ${firstError || "Please check your Supabase connection."}`
                        : nothingToSend
                            ? "There are no users or health records on this kiosk to upload."
                            : "Cloud sync finished with nothing to report.",
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
                    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                        {/* The sidebar becomes an off-canvas drawer below the
                            desktop breakpoint (see Sidebar.jsx), so this is
                            the only way to reach it there. */}
                        <button
                            type="button"
                            onClick={onOpenMobileNav}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] border shadow-sm transition hk-admin-nav-hover lg:hidden"
                            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                            aria-label="Open navigation menu"
                        >
                            <Menu size={20} />
                        </button>

                        <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.15rem] shadow-lg"
                            style={{
                                background: "linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 60%, black))",
                                boxShadow: "0 8px 20px -6px color-mix(in srgb, var(--color-primary) 80%, transparent)",
                                color: "var(--color-primary-content)"
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
                            
                        </div>

                        <div className="relative">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="button"
                                onClick={() => setProfileOpen((current) => ! current)}
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
                                    className="flex h-10 w-10 items-center justify-center rounded-[1rem] shadow-md"
                                    style={{
                                        background: "linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 70%, black))",
                                        color: "var(--color-primary-content)"
                                    }}
                                >
                                    <ShieldCheck size={18} />
                                </span>
                                <span className="hidden text-left sm:block">
                                    <span className="block text-sm font-black tracking-tight">{adminDisplayName}</span>
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
                                            <p className="font-black text-lg">{adminDisplayName}</p>
                                            <p className="mt-1 truncate text-xs font-medium" style={{ color: "var(--color-muted)" }}>
                                                {adminUser?.email || "Loading account..."}
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

            {profileOpen ? (
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
