const statusStyles = {
    Pending: "var(--color-primary)",
    Reviewed: "var(--color-success)",
    Resolved: "var(--color-success)",
    Escalated: "var(--color-error)",
};

export default function AlertStatusBadge({ status }) {
    const color = statusStyles[status] || "var(--color-muted)";

    return (
        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-black" style={{ color, backgroundColor: "color-mix(in srgb, currentColor 10%, transparent)" }}>
            {status}
        </span>
    );
}
