import { useCallback, useRef } from "react";

export function useSidebarUI({ collapsed }) {
    const tooltipRef = useRef(null);
    const tooltipLabelRef = useRef(null);
    const flyoutRef = useRef(null);
    const flyoutTimer = useRef(null);

    const hideTooltip = useCallback(() => {
        if (tooltipRef.current) {
            tooltipRef.current.dataset.open = "false";
        }
    }, []);

    const showTooltip = useCallback((label, event) => {
        if (! collapsed || ! tooltipRef.current || ! tooltipLabelRef.current) return;

        const rect = event.currentTarget.getBoundingClientRect();
        tooltipLabelRef.current.textContent = label;
        tooltipRef.current.style.top = `${rect.top + rect.height / 2}px`;
        tooltipRef.current.dataset.open = "true";
    }, [collapsed]);

    const closeUserFlyout = useCallback(() => {
        if (flyoutRef.current) {
            flyoutRef.current.dataset.open = "false";
        }
    }, []);

    const openUserFlyout = useCallback((event) => {
        if (! collapsed || ! flyoutRef.current) return;

        window.clearTimeout(flyoutTimer.current);

        const rect = event.currentTarget.getBoundingClientRect();
        hideTooltip();
        flyoutRef.current.style.top = `${rect.top + rect.height / 2}px`;
        flyoutRef.current.dataset.open = "true";
    }, [collapsed, hideTooltip]);

    const scheduleUserFlyoutClose = useCallback(() => {
        flyoutTimer.current = window.setTimeout(closeUserFlyout, 120);
    }, [closeUserFlyout]);

    const keepUserFlyoutOpen = useCallback(() => {
        window.clearTimeout(flyoutTimer.current);
    }, []);

    const closeFloatingUI = useCallback(() => {
        hideTooltip();
        closeUserFlyout();
    }, [closeUserFlyout, hideTooltip]);

    return {
        tooltipRef,
        tooltipLabelRef,
        flyoutRef,
        showTooltip,
        hideTooltip,
        openUserFlyout,
        scheduleUserFlyoutClose,
        keepUserFlyoutOpen,
        closeFloatingUI,
    };
}
