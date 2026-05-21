const styles = {
    Ready: "var(--color-success)",
    Generated: "var(--color-primary)",
    Scheduled: "var(--color-muted)",
    Exported: "var(--color-success)",
    Failed: "var(--color-error)",
};

export default function ReportStatusBadge({ status }) {
    const color = styles[status] || "var(--color-muted)";

    return (
        <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-black" style={{ color, borderColor: "color-mix(in srgb, currentColor 36%, transparent)", backgroundColor: "color-mix(in srgb, currentColor 10%, transparent)" }}>
            {status}
        </span>
    );
}
