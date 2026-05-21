export const sidebarMotion = {
    shell: "sidebar-shell relative hidden min-h-screen shrink-0 overflow-hidden p-4 lg:block",
    inner: "sidebar-inner sticky top-4 flex h-[calc(100vh-2rem)] w-[18rem] flex-col rounded-[16px] border shadow-lg",
    label: "sidebar-label min-w-0 overflow-hidden",
    sectionLabel: "sidebar-section-label mb-2 px-3 text-[0.68rem] font-black uppercase tracking-[0.18em]",
    tooltip: "sidebar-floating sidebar-tooltip pointer-events-none fixed z-50 rounded-xl border px-3 py-2 text-xs font-black shadow-lg",
    flyout: "sidebar-floating sidebar-flyout fixed z-50 w-56 rounded-[14px] border p-2 shadow-lg",
    navItem: "transform-gpu transition-colors hk-sidebar-nav-item",
    navItemExpanded: "group flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-black hk-admin-nav-hover",
    navItemCollapsed: "group flex h-12 w-12 items-center justify-center rounded-xl text-sm font-black hk-sidebar-collapsed-item",
};

export const sidebarPanelStyle = {
    backgroundColor: "var(--color-card)",
    borderColor: "var(--color-border)",
};
