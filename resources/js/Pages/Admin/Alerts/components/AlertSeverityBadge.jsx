const severityStyles = {
    Low: "var(--color-success)",
    Medium: "var(--color-primary)",
    High: "var(--color-primary)",
    Critical: "var(--color-error)",
};

export default function AlertSeverityBadge({ severity }) {
    const color = severityStyles[severity] || "var(--color-muted)";

    return (
        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-black" style={{ color, backgroundColor: "color-mix(in srgb, currentColor 10%, transparent)" }}>
            {severity}
        </span>
    );
}
