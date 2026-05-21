export default function ExportStatusBadge({ status }) {
    const color = status === "Completed" ? "var(--color-success)" : status === "Queued" ? "var(--color-primary)" : "var(--color-muted)";

    return (
        <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-black" style={{ color, borderColor: "color-mix(in srgb, currentColor 35%, transparent)", backgroundColor: "color-mix(in srgb, currentColor 9%, transparent)" }}>
            {status}
        </span>
    );
}
