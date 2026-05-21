import { memo, useCallback, useMemo, useState } from "react";
import {
    Activity,
    BarChart3,
    ChevronDown,
    ChevronsLeft,
    ChevronsRight,
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
} from "lucide-react";
import { sidebarMotion, sidebarPanelStyle } from "../Animations/sidebarMotion";
import { useSidebarUI } from "../hooks/useSidebarUI";

const mainItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { label: "Health Records", icon: ClipboardList, path: "/admin/health-records" },
    { label: "Measurement Analytics", icon: BarChart3, path: "/admin/analytics" },
    { label: "Health Alerts", icon: ShieldAlert, path: "/admin/alerts" },
    { label: "Reports", icon: FileText, path: "/admin/reports" },
];

const userItems = [
    { label: "Students", icon: UsersRound, path: "/admin/students" },
    { label: "Teachers", icon: Stethoscope, path: "/admin/teachers" },
];

const systemItems = [
    { label: "Kiosk Sessions", icon: Activity, path: "/admin/sessions" },
    { label: "Devices & Sensors", icon: RadioTower, path: "/admin/devices" },
    { label: "Activity Logs", icon: Gauge, path: "/admin/activity-logs" },
    { label: "Settings", icon: Settings, path: "/admin/settings" },
];

const accountItems = [
    { label: "Profile", icon: UserCog, path: "/admin/profile" },
];

export default function Sidebar({ navigate, pathname = "" }) {
    const [collapsed, setCollapsed] = useState(false);
    const [userManagementOpen, setUserManagementOpen] = useState(false);
    const activePath = pathname;
    const userManagementActive = useMemo(
        () => userItems.some((item) => item.path === activePath),
        [activePath],
    );
    const {
        tooltipRef,
        tooltipLabelRef,
        flyoutRef,
        showTooltip,
        hideTooltip,
        openUserFlyout,
        scheduleUserFlyoutClose,
        keepUserFlyoutOpen,
        closeFloatingUI,
    } = useSidebarUI({ collapsed });

    const toggleCollapsed = useCallback(() => {
        closeFloatingUI();
        setCollapsed((current) => ! current);
    }, [closeFloatingUI]);

    const handleNavigate = useCallback((path) => {
        closeFloatingUI();
        if (path && navigate) navigate(path);
    }, [closeFloatingUI, navigate]);

    const toggleUserManagement = useCallback((event) => {
        if (collapsed) {
            openUserFlyout(event);
            return;
        }

        setUserManagementOpen((current) => ! current);
    }, [collapsed, openUserFlyout]);

    return (
        <aside className={sidebarMotion.shell} data-collapsed={collapsed} style={{ color: "var(--color-text)" }}>
            <div className={sidebarMotion.inner} style={sidebarPanelStyle}>
                <div
                    className="relative flex h-[5.75rem] shrink-0 items-center border-b px-4"
                    style={{ borderColor: "var(--color-border)" }}
                >
                    <button
                        type="button"
                        onClick={toggleCollapsed}
                        className="fixed z-50 flex h-7 w-7 items-center justify-center rounded-full border shadow-sm hk-soft-hover"
                        style={{
                            left: collapsed ? "5.55rem" : "18.55rem",
                            top: "5.85rem",
                            backgroundColor: "var(--color-card)",
                            borderColor: "var(--color-border)",
                        }}
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {collapsed ? <ChevronsRight size={13} /> : <ChevronsLeft size={13} />}
                    </button>

                    <div className="flex w-full items-center gap-3">
                        <div
                            className="sidebar-logo flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                            style={{ backgroundColor: "var(--color-text)", color: "var(--color-bg)" }}
                        >
                            <HeartPulse size={21} />
                        </div>

                        <div className={sidebarMotion.label}>
                            <p className="truncate text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--color-muted)" }}>
                                Health Kiosk
                            </p>
                            <p className="truncate text-base font-black">Admin Console</p>
                            <p className="truncate text-xs font-bold" style={{ color: "var(--color-muted)" }}>
                                Clinic management
                            </p>
                        </div>
                    </div>
                </div>

                <nav className="hk-sidebar-scroll min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-5">
                    <SidebarSection label="Main" collapsed={collapsed}>
                        {mainItems.map((item) => (
                            <SidebarItem
                                key={item.path}
                                item={item}
                                active={activePath === item.path}
                                collapsed={collapsed}
                                onShowTooltip={showTooltip}
                                onHideTooltip={hideTooltip}
                                onNavigate={handleNavigate}
                            />
                        ))}
                    </SidebarSection>

                    <SidebarSection label="User Management" collapsed={collapsed} hideLabel>
                        <UserManagementButton
                            active={userManagementActive}
                            collapsed={collapsed}
                            open={userManagementOpen}
                            onMouseEnter={openUserFlyout}
                            onMouseLeave={scheduleUserFlyoutClose}
                            onClick={toggleUserManagement}
                        />

                        <div
                            className="sidebar-tree relative ml-5 mt-1 space-y-1 overflow-hidden pl-4"
                            data-open={userManagementOpen && ! collapsed}
                        >
                            <span
                                className="absolute bottom-5 left-0 top-0 w-px"
                                style={{ backgroundColor: "var(--color-border)" }}
                            />
                            {userItems.map((item) => (
                                <TreeItem
                                    key={item.path}
                                    item={item}
                                    active={activePath === item.path}
                                    onNavigate={handleNavigate}
                                />
                            ))}
                        </div>
                    </SidebarSection>

                    <SidebarSection label="System" collapsed={collapsed}>
                        {systemItems.map((item) => (
                            <SidebarItem
                                key={item.path}
                                item={item}
                                active={activePath === item.path}
                                collapsed={collapsed}
                                onShowTooltip={showTooltip}
                                onHideTooltip={hideTooltip}
                                onNavigate={handleNavigate}
                            />
                        ))}
                    </SidebarSection>

                    <SidebarSection label="Account" collapsed={collapsed}>
                        {accountItems.map((item) => (
                            <SidebarItem
                                key={item.path}
                                item={item}
                                active={activePath === item.path}
                                collapsed={collapsed}
                                onShowTooltip={showTooltip}
                                onHideTooltip={hideTooltip}
                                onNavigate={handleNavigate}
                            />
                        ))}
                    </SidebarSection>
                </nav>

                <footer className="shrink-0 border-t p-3" style={{ borderColor: "var(--color-border)" }}>
                    <SidebarFooter collapsed={collapsed} onShowTooltip={showTooltip} onHideTooltip={hideTooltip} />
                </footer>
            </div>

            <SidebarTooltip tooltipRef={tooltipRef} tooltipLabelRef={tooltipLabelRef} />
            <UserFlyout
                flyoutRef={flyoutRef}
                activePath={activePath}
                onMouseEnter={keepUserFlyoutOpen}
                onMouseLeave={scheduleUserFlyoutClose}
                onNavigate={handleNavigate}
            />
        </aside>
    );
}

const SidebarSection = memo(function SidebarSection({ label, collapsed, hideLabel = false, children }) {
    return (
        <div className="mb-4">
            {! hideLabel ? (
                <p className={sidebarMotion.sectionLabel} data-collapsed={collapsed} style={{ color: "var(--color-muted)" }}>
                    {label}
                </p>
            ) : null}
            <div className="space-y-1">{children}</div>
        </div>
    );
});

const SidebarItem = memo(function SidebarItem({ item, active, collapsed, onShowTooltip, onHideTooltip, onNavigate }) {
    const Icon = item.icon;
    const handleClick = useCallback(() => onNavigate(item.path), [item.path, onNavigate]);
    const handleMouseEnter = useCallback((event) => onShowTooltip(item.label, event), [item.label, onShowTooltip]);

    return (
        <button
            type="button"
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={onHideTooltip}
            className={`${sidebarMotion.navItem} ${collapsed ? sidebarMotion.navItemCollapsed : sidebarMotion.navItemExpanded}${active ? " hk-sidebar-nav-item--active" : ""}`}
            style={{
                backgroundColor: "transparent",
                color: active ? "var(--color-text)" : "var(--color-muted)",
            }}
        >
            <Icon size={18} className="shrink-0" />
            <span className={sidebarMotion.label}>{item.label}</span>
        </button>
    );
});

const UserManagementButton = memo(function UserManagementButton({ active, collapsed, open, onMouseEnter, onMouseLeave, onClick }) {
    return (
        <button
            type="button"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={onClick}
            aria-expanded={open}
            className={`${sidebarMotion.navItem} ${collapsed ? sidebarMotion.navItemCollapsed : sidebarMotion.navItemExpanded}${active ? " hk-sidebar-nav-item--active" : ""}`}
            style={{
                backgroundColor: "transparent",
                color: active ? "var(--color-text)" : "var(--color-muted)",
            }}
        >
            <UsersRound size={18} className="shrink-0" />
            <span className={sidebarMotion.label}>User Management</span>
            <ChevronDown
                size={15}
                className="sidebar-chevron shrink-0"
                data-collapsed={collapsed}
                style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
            />
        </button>
    );
});

const TreeItem = memo(function TreeItem({ item, active, onNavigate }) {
    const Icon = item.icon;
    const handleClick = useCallback(() => onNavigate(item.path), [item.path, onNavigate]);

    return (
        <button
            type="button"
            onClick={handleClick}
            className={`group relative flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold transition-colors hk-admin-nav-hover hk-sidebar-nav-item${active ? " hk-sidebar-nav-item--active" : ""}`}
            style={{
                backgroundColor: "transparent",
                color: active ? "var(--color-text)" : "var(--color-muted)",
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
});

const FlyoutItem = memo(function FlyoutItem({ item, active, onNavigate }) {
    const Icon = item.icon;
    const handleClick = useCallback(() => onNavigate(item.path), [item.path, onNavigate]);

    return (
        <button
            type="button"
            onClick={handleClick}
            className={`group flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-black transition-colors hk-admin-nav-hover hk-sidebar-nav-item${active ? " hk-sidebar-nav-item--active" : ""}`}
            style={{
                backgroundColor: "transparent",
                color: active ? "var(--color-text)" : "var(--color-muted)",
            }}
        >
            <Icon size={17} className="shrink-0" />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
        </button>
    );
});

const SidebarFooter = memo(function SidebarFooter({ collapsed, onShowTooltip, onHideTooltip }) {
    const handleMouseEnter = useCallback((event) => onShowTooltip("Health Kiosk admin", event), [onShowTooltip]);

    return (
        <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={onHideTooltip}
            className={collapsed
                ? "flex h-14 w-14 items-center justify-center rounded-xl border px-0 transition-colors"
                : "flex h-14 items-center gap-3 rounded-xl border px-3 transition-colors"
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
            <div className={sidebarMotion.label}>
                <p className="truncate text-sm font-black">Health Kiosk</p>
                <p className="truncate text-xs font-bold" style={{ color: "var(--color-muted)" }}>
                    Admin access active
                </p>
            </div>
        </div>
    );
});

const SidebarTooltip = memo(function SidebarTooltip({ tooltipRef, tooltipLabelRef }) {
    return (
        <div
            ref={tooltipRef}
            className={sidebarMotion.tooltip}
            data-open="false"
            style={{
                left: "6.4rem",
                backgroundColor: "var(--color-card)",
                borderColor: "var(--color-border)",
                color: "var(--color-text)",
            }}
        >
            <span ref={tooltipLabelRef} />
        </div>
    );
});

const UserFlyout = memo(function UserFlyout({ flyoutRef, activePath, onMouseEnter, onMouseLeave, onNavigate }) {
    return (
        <div
            ref={flyoutRef}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className={sidebarMotion.flyout}
            data-open="false"
            style={{
                left: "6.4rem",
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
                        key={item.path}
                        item={item}
                        active={activePath === item.path}
                        onNavigate={onNavigate}
                    />
                ))}
            </div>
        </div>
    );
});
