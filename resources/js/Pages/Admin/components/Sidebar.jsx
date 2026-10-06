import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { authService } from "../../Auth/services/authService";
import {
    Activity,
    BarChart3,
    ChevronDown,
    ChevronsLeft,
    ClipboardList,
    FileText,
    Gauge,
    HeartPulse,
    LayoutDashboard,
    RadioTower,
    Settings,
    ShieldAlert,
    Stethoscope,
    UserCog,
    UsersRound,
    X,
} from "lucide-react";

const mainItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { label: "Health Records", icon: ClipboardList, path: "/admin/health-records" },
    { label: "Data Analytics", icon: BarChart3, path: "/admin/analytics" },
    { label: "Health Alerts", icon: ShieldAlert, path: "/admin/alerts" },
    { label: "Reports", icon: FileText, path: "/admin/reports" },
];

const userItems = [
    { label: "Students", icon: UsersRound, path: "/admin/students" },
    { label: "Teachers", icon: Stethoscope, path: "/admin/teachers" },
];

const systemItems = [
    { label: "Kiosk Sessions", icon: Activity, path: "/admin/sessions" },
    // { label: "Devices & Sensors", icon: RadioTower, path: "/admin/devices" },
    // { label: "Live Vitals", icon: HeartPulse, path: "/admin/live-vitals" },
    { label: "Activity Logs", icon: Gauge, path: "/admin/activity-logs" },
    { label: "Settings", icon: Settings, path: "/admin/settings" },
];

const accountItems = [
    { label: "Profile", icon: UserCog, path: "/admin/profile" },
];

const SIDEBAR_SCROLL_KEY = "healthKioskAdminSidebarScrollTop";
const SIDEBAR_USER_GROUP_KEY = "healthKioskAdminSidebarUserGroupOpen";
const SIDEBAR_COLLAPSED_KEY = "healthKioskAdminSidebarCollapsed";
const SIDEBAR_ACTIVE_PATH_KEY = "healthKioskAdminSidebarActivePath";

export default function Sidebar({ navigate, pathname, mobileOpen = false, onCloseMobile }) {
    const shouldReduceMotion = useReducedMotion();
    const [collapsed, setCollapsed] = useState(() => window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true");
    const [userManagementOpen, setUserManagementOpen] = useState(() => window.localStorage.getItem(SIDEBAR_USER_GROUP_KEY) === "true");
    const [tooltip, setTooltip] = useState(null);
    const [userFlyout, setUserFlyout] = useState(null);
    const sidebarScrollRef = useRef(null);
    const activeItemRef = useRef(null);
    const flyoutTimer = useRef(null);
    const saveScrollFrame = useRef(null);
    const currentPath = pathname || window.location.pathname;
    const userManagementActive = userItems.some((item) => item.path === currentPath);
    const [unreadAlerts, setUnreadAlerts] = useState(0);

    // `collapsed` is a desktop preference, persisted independently of screen
    // size. The mobile drawer always shows full labels regardless of it -
    // there is no icon-only rail to collapse into on a phone - so every
    // render decision below reads this instead of the raw preference.
    const isCollapsedView = collapsed && !mobileOpen;

    useEffect(() => {
        const fetchAlerts = () => {
            authService.adminAlertsUnreadCount().then((res) => {
                setUnreadAlerts(res.data.count || 0);
            }).catch(() => {});
        };

        fetchAlerts();
        window.addEventListener('refresh-alert-count', fetchAlerts);
        return () => window.removeEventListener('refresh-alert-count', fetchAlerts);
    }, []);

    useEffect(() => {
        if (userManagementActive && !isCollapsedView) {
            setUserManagementOpen(true);
        }
    }, [isCollapsedView, userManagementActive]);

    useEffect(() => {
        window.localStorage.setItem(SIDEBAR_ACTIVE_PATH_KEY, currentPath);
    }, [currentPath]);

    useEffect(() => {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "true" : "false");
    }, [collapsed]);

    useEffect(() => {
        window.localStorage.setItem(SIDEBAR_USER_GROUP_KEY, userManagementOpen ? "true" : "false");
    }, [userManagementOpen]);

    useEffect(() => {
        const scroller = sidebarScrollRef.current;
        if (!scroller) return undefined;

        const storedScrollTop = Number(window.localStorage.getItem(SIDEBAR_SCROLL_KEY) || 0);
        scroller.scrollTop = storedScrollTop;

        const frame = window.requestAnimationFrame(() => {
            const activeItem = activeItemRef.current;
            if (!activeItem) return;

            const scrollerRect = scroller.getBoundingClientRect();
            const activeRect = activeItem.getBoundingClientRect();
            const isAbove = activeRect.top < scrollerRect.top + 12;
            const isBelow = activeRect.bottom > scrollerRect.bottom - 12;

            if (isAbove || isBelow) {
                activeItem.scrollIntoView({ block: "center", behavior: "auto" });
            }
        });

        return () => window.cancelAnimationFrame(frame);
    }, [isCollapsedView, currentPath, userManagementOpen]);

    useEffect(() => {
        return () => {
            if (saveScrollFrame.current) {
                window.cancelAnimationFrame(saveScrollFrame.current);
            }
        };
    }, []);

    const showTooltip = (label, event) => {
        if (! isCollapsedView) return;

        const rect = event.currentTarget.getBoundingClientRect();
        setTooltip({
            label,
            top: rect.top + rect.height / 2,
        });
    };

    const hideTooltip = () => setTooltip(null);
    const saveSidebarScroll = () => {
        if (saveScrollFrame.current) return;

        saveScrollFrame.current = window.requestAnimationFrame(() => {
            const scroller = sidebarScrollRef.current;
            if (scroller) {
                window.localStorage.setItem(SIDEBAR_SCROLL_KEY, String(scroller.scrollTop));
            }
            saveScrollFrame.current = null;
        });
    };
    const openUserFlyout = (event) => {
        if (! isCollapsedView) return;

        window.clearTimeout(flyoutTimer.current);

        const rect = event.currentTarget.getBoundingClientRect();
        setTooltip(null);
        setUserFlyout({
            top: rect.top + rect.height / 2,
        });
    };
    const scheduleUserFlyoutClose = () => {
        flyoutTimer.current = window.setTimeout(() => setUserFlyout(null), 120);
    };
    const keepUserFlyoutOpen = () => {
        window.clearTimeout(flyoutTimer.current);
    };
    const goTo = (path) => {
        if (sidebarScrollRef.current) {
            window.localStorage.setItem(SIDEBAR_SCROLL_KEY, String(sidebarScrollRef.current.scrollTop));
        }
        hideTooltip();
        setUserFlyout(null);
        onCloseMobile?.();

        if (path && navigate) navigate(path);
    };

    // Below the desktop breakpoint the sidebar stops being a column beside
    // the page and becomes a drawer over it - closable with Escape, and with
    // the page behind it locked from scrolling while it's open, same as any
    // other full-screen overlay in the app (see ModalShell/DrawerShell).
    useEffect(() => {
        if (!mobileOpen) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") onCloseMobile?.();
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [mobileOpen, onCloseMobile]);

    return (
        <>
            {/* Backdrop: mobile/tablet only - the desktop sidebar never
                triggers mobileOpen since the burger button that sets it is
                itself hidden at the lg breakpoint. */}
            {mobileOpen ? (
                <button
                    type="button"
                    onClick={onCloseMobile}
                    aria-label="Close navigation menu"
                    className="fixed inset-0 z-[290] bg-black/50 backdrop-blur-sm lg:hidden"
                />
            ) : null}

            <aside
                className={`hk-admin-sidebar fixed inset-y-0 left-0 z-[300] h-screen w-[85vw] max-w-[22rem] shrink-0 px-4 pb-4 pt-4 transition-transform duration-[260ms] ease-in-out
                    ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
                    lg:sticky lg:top-6 lg:z-[100] lg:h-[calc(100vh-1.5rem)] lg:w-auto lg:max-w-none lg:translate-x-0 lg:px-6 lg:pb-6 lg:pt-0 lg:transition-[width]
                    ${collapsed ? "lg:w-[8.5rem]" : "lg:w-[21.5rem]"}`}
                style={{ color: "var(--color-text)" }}
            >
                {/* Collapse/expand: a desktop-only concept - on mobile the
                    drawer is either fully open or fully closed. */}
                <button
                    type="button"
                    onClick={() => setCollapsed((current) => ! current)}
                    className="absolute right-2 top-[5.75rem] z-30 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border shadow-md hk-soft-hover lg:flex"
                    style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <span className="flex transition-transform duration-200 ease-out" style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)" }}>
                        <ChevronsLeft size={13} />
                    </span>
                </button>

                <div
                    className="hk-sidebar-shell flex h-full flex-col overflow-hidden rounded-2xl border shadow-xl backdrop-blur-xl"
                    style={{
                        backgroundColor: "color-mix(in srgb, var(--color-card) 92%, transparent)",
                        borderColor: "var(--color-border)",
                    }}
                >
                    <div
                        className="relative flex h-[5.75rem] shrink-0 items-center border-b px-4"
                        style={{ borderColor: "var(--color-border)" }}
                    >
                        <div className={isCollapsedView ? "flex w-full items-center justify-center" : "flex w-full items-center gap-3"}>
                            <div
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                                style={{ backgroundColor: "var(--color-text)", color: "var(--color-bg)" }}
                            >
                                <HeartPulse size={21} />
                            </div>

                            {! isCollapsedView ? (
                                <div className="min-w-0 flex-1 overflow-hidden">
                                    <p className="truncate text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--color-muted)" }}>
                                        Health Kiosk
                                    </p>
                                    <p className="truncate text-base font-black">Admin Console</p>
                                    <p className="truncate text-xs font-bold" style={{ color: "var(--color-muted)" }}>
                                        Clinic management
                                    </p>
                                </div>
                            ) : null}
                        </div>

                        <button
                            type="button"
                            onClick={onCloseMobile}
                            className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border lg:hidden"
                            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                            aria-label="Close navigation menu"
                        >
                            <X size={17} />
                        </button>
                    </div>

                <nav
                    ref={sidebarScrollRef}
                    onScroll={saveSidebarScroll}
                    className="hk-sidebar-scroll min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-5"
                >
                    <SidebarSection label="Main" collapsed={isCollapsedView}>
                        {mainItems.map((item) => (
                            <SidebarItem
                                key={item.label}
                                item={{
                                    ...item,
                                    active: currentPath === item.path,
                                    badge: item.label === "Health Alerts" && unreadAlerts > 0 ? unreadAlerts : null
                                }}
                                activeRef={activeItemRef}
                                collapsed={isCollapsedView}
                                onShowTooltip={showTooltip}
                                onHideTooltip={hideTooltip}
                                onClick={() => goTo(item.path)}
                            />
                        ))}
                    </SidebarSection>

                    <SidebarSection label="User Management" collapsed={isCollapsedView} hideLabel>
                        <button
                            type="button"
                            onMouseEnter={(event) => {
                                if (isCollapsedView) openUserFlyout(event);
                            }}
                            onMouseLeave={() => {
                                if (isCollapsedView) scheduleUserFlyoutClose();
                            }}
                            onClick={(event) => {
                                if (isCollapsedView) {
                                    openUserFlyout(event);
                                    return;
                                }

                                setUserManagementOpen((current) => ! current);
                            }}
                            aria-expanded={userManagementOpen}
                            ref={userManagementActive && (isCollapsedView || !userManagementOpen) ? activeItemRef : null}
                            className={isCollapsedView
                                ? `group mx-auto flex h-12 w-12 items-center justify-center rounded-xl text-sm font-black hk-sidebar-collapsed-item hk-sidebar-nav-item${userManagementActive ? " hk-sidebar-nav-item--active" : ""}`
                                : `group flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-black hk-sidebar-nav-item${userManagementActive ? " hk-sidebar-nav-item--active" : " hk-admin-nav-hover"}`
                            }
                            style={{
                                backgroundColor: "transparent",
                                color: userManagementActive ? "var(--color-text)" : "var(--color-muted)",
                            }}
                        >
                            {isCollapsedView ? (
                                <UsersRound size={18} />
                            ) : (
                                <>
                                    <UsersRound size={18} className="shrink-0" />
                                    <span className="min-w-0 flex-1 truncate">User Management</span>
                                </>
                            )}
                            {! isCollapsedView ? (
                                <>
                                    {/* Count of items in the group, and a dot when
                                        one of them is the current page — so a
                                        collapsed group still says where you are. */}
                                    {! userManagementOpen && userManagementActive ? (
                                        <span
                                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                                            style={{ backgroundColor: "var(--color-primary)" }}
                                        />
                                    ) : null}
                                    <ChevronDown
                                        size={15}
                                        className="shrink-0 transition-transform duration-200 ease-out"
                                        style={{ transform: userManagementOpen ? "rotate(0deg)" : "rotate(-90deg)" }}
                                    />
                                </>
                            ) : null}
                        </button>

                        {/* Animated height so the group opens and closes instead
                            of snapping — the standard behaviour for a nav
                            disclosure, and it keeps the eye anchored. */}
                        <AnimatePresence initial={false}>
                            {userManagementOpen && ! isCollapsedView ? (
                                <motion.div
                                    key="user-management-group"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{
                                        height: { duration: shouldReduceMotion ? 0.01 : 0.24, ease: [0.16, 1, 0.3, 1] },
                                        opacity: { duration: shouldReduceMotion ? 0.01 : 0.16 },
                                    }}
                                    className="overflow-hidden"
                                >
                                    <div className="relative ml-5 mt-1 space-y-1 pl-4">
                                        <span
                                            className="absolute bottom-5 left-0 top-0 w-px"
                                            style={{ backgroundColor: "var(--color-border)" }}
                                        />
                                        {userItems.map((item) => (
                                            <TreeItem
                                                key={item.label}
                                                item={{ ...item, active: currentPath === item.path }}
                                                activeRef={activeItemRef}
                                                onClick={() => goTo(item.path)}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </SidebarSection>

                    <SidebarSection label="System" collapsed={isCollapsedView}>
                        {systemItems.map((item) => (
                            <SidebarItem
                                key={item.label}
                                item={{ ...item, active: currentPath === item.path }}
                                activeRef={activeItemRef}
                                collapsed={isCollapsedView}
                                onShowTooltip={showTooltip}
                                onHideTooltip={hideTooltip}
                                onClick={() => goTo(item.path)}
                            />
                        ))}
                    </SidebarSection>

                    <SidebarSection label="Account" collapsed={isCollapsedView}>
                        {accountItems.map((item) => (
                            <SidebarItem
                                key={item.label}
                                item={{ ...item, active: currentPath === item.path }}
                                activeRef={activeItemRef}
                                collapsed={isCollapsedView}
                                onShowTooltip={showTooltip}
                                onHideTooltip={hideTooltip}
                                onClick={() => goTo(item.path)}
                            />
                        ))}
                    </SidebarSection>
                </nav>

                <footer className="shrink-0 border-t p-3" style={{ borderColor: "var(--color-border)" }}>
                    <div
                        onMouseEnter={(event) => showTooltip("Health Kiosk admin", event)}
                        onMouseLeave={hideTooltip}
                        className={isCollapsedView
                            ? "flex h-14 items-center justify-center rounded-xl border px-0"
                            : "flex h-14 items-center gap-3 rounded-xl border px-3"
                        }
                        style={{
                            backgroundColor: "var(--color-surface)",
                            borderColor: "var(--color-border)",
                        }}
                    >
                        <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-black"
                            style={{ backgroundColor: "var(--color-text)", color: "var(--color-bg)" }}
                        >
                            HK
                        </div>
                        {! isCollapsedView ? (
                            <div className="min-w-0 overflow-hidden">
                                <p className="truncate text-sm font-black">Health Kiosk</p>
                                <p className="truncate text-xs font-bold" style={{ color: "var(--color-muted)" }}>
                                    Admin access active
                                </p>
                            </div>
                        ) : null}
                    </div>
                </footer>
            </div>

            {tooltip ? (
                <div
                    className="hk-sidebar-tooltip pointer-events-none fixed z-[200] rounded-xl border px-3 py-2 text-xs font-black shadow-lg"
                    style={{
                        left: "6.4rem",
                        top: tooltip.top,
                        transform: "translateY(-50%)",
                        backgroundColor: "var(--color-card)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-text)",
                    }}
                >
                    {tooltip.label}
                </div>
            ) : null}

            {userFlyout ? (
                <div
                    onMouseEnter={keepUserFlyoutOpen}
                    onMouseLeave={scheduleUserFlyoutClose}
                    className="hk-sidebar-flyout fixed z-[200] w-56 rounded-[1.25rem] border p-2 shadow-lg"
                    style={{
                        left: "6.4rem",
                        top: userFlyout.top,
                        transform: "translateY(-50%)",
                        backgroundColor: "var(--color-card)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-text)",
                    }}
                >
                    <div className="border-b px-3 py-2" style={{ borderColor: "var(--color-border)" }}>
                        <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--color-muted)" }}>
                            User Management
                        </p>
                    </div>
                    <div className="mt-2 space-y-1">
                        {userItems.map((item) => (
                            <FlyoutItem
                                key={item.label}
                                item={{ ...item, active: currentPath === item.path }}
                                onClick={() => goTo(item.path)}
                            />
                        ))}
                    </div>
                </div>
            ) : null}
            </aside>
        </>
    );
}

function SidebarSection({ label, collapsed, hideLabel = false, children }) {
    return (
        <div className="mb-4">
            {! collapsed && ! hideLabel ? (
                <p className="mb-2 px-3 text-[0.68rem] font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-muted)" }}>
                    {label}
                </p>
            ) : null}
            <div className="space-y-1">{children}</div>
        </div>
    );
}

function SidebarItem({ item, activeRef, collapsed, onShowTooltip, onHideTooltip, onClick }) {
    const Icon = item.icon;

    return (
        <button
            ref={item.active ? activeRef : null}
            type="button"
            onClick={onClick}
            onMouseEnter={(event) => onShowTooltip(item.label, event)}
            onMouseLeave={onHideTooltip}
            className={collapsed
                ? `group mx-auto flex h-12 w-12 items-center justify-center rounded-xl text-sm font-black hk-sidebar-collapsed-item hk-sidebar-nav-item${item.active ? " hk-sidebar-nav-item--active" : ""}`
                : `group flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-black hk-sidebar-nav-item${item.active ? " hk-sidebar-nav-item--active" : " hk-admin-nav-hover"}`
            }
            style={{
                backgroundColor: "transparent",
                color: item.active ? "var(--color-text)" : "var(--color-muted)",
            }}
        >
            {collapsed ? (
                <div className="relative">
                    <Icon size={18} />
                    {item.badge && (
                        <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[10px] text-white outline outline-2 outline-white dark:outline-gray-900" />
                    )}
                </div>
            ) : (
                <>
                    <Icon size={18} className="shrink-0" />
                    <span className="min-w-0 flex-1 truncate">
                        {item.label}
                    </span>
                    {item.badge && (
                        <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[0.65rem] font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">
                            {item.badge} unresolved
                        </span>
                    )}
                </>
            )}
        </button>
    );
}

function TreeItem({ item, activeRef, onClick }) {
    const Icon = item.icon;

    return (
        <button
            ref={item.active ? activeRef : null}
            type="button"
            onClick={onClick}
            className={`group relative flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold hk-sidebar-nav-item${item.active ? " hk-sidebar-nav-item--active" : " hk-admin-nav-hover"}`}
            style={{
                backgroundColor: "transparent",
                color: item.active ? "var(--color-text)" : "var(--color-muted)",
            }}
        >
            <span
                className="absolute -left-4 top-1/2 h-px w-4"
                style={{ backgroundColor: "var(--color-border)" }}
            />
            <Icon size={16} className="shrink-0" />
            <span className="min-w-0 truncate">{item.label}</span>
        </button>
    );
}

function FlyoutItem({ item, onClick }) {
    const Icon = item.icon;

    return (
        <button
            type="button"
            onClick={onClick}
            className={`group flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-black hk-sidebar-nav-item${item.active ? " hk-sidebar-nav-item--active" : " hk-admin-nav-hover"}`}
            style={{
                backgroundColor: "transparent",
                color: item.active ? "var(--color-text)" : "var(--color-muted)",
            }}
        >
            <Icon size={17} className="shrink-0" />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
        </button>
    );
}
