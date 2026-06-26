export function readThemeColor(variable, fallback = "#2563eb") {
    if (typeof document === "undefined") return fallback;

    const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();

    return value || fallback;
}

export function getChartTheme() {
    return {
        primary: readThemeColor("--color-primary"),
        success: readThemeColor("--color-success"),
        error: readThemeColor("--color-error"),
        muted: readThemeColor("--color-muted"),
        border: readThemeColor("--color-border"),
        text: readThemeColor("--color-text"),
        surface: readThemeColor("--color-surface"),
    };
}

export const chartTooltipStyle = {
    backgroundColor: "color-mix(in srgb, var(--color-card) 96%, transparent)",
    border: "1px solid var(--color-border)",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: 700,
    color: "var(--color-text)",
};
