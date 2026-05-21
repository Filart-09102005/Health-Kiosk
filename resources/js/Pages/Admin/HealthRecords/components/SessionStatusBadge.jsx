const toneMap = {
    Completed: "success",
    Incomplete: "error",
    "In Progress": "primary",
};

const colorVar = {
    success: "var(--color-success)",
    error: "var(--color-error)",
    primary: "var(--color-primary)",
};

export default function SessionStatusBadge({ status }) {
    const color = colorVar[toneMap[status]] || "var(--color-muted)";

    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-wide"
            style={{ color, backgroundColor: "color-mix(in srgb, currentColor 12%, transparent)" }}
        >
            {status === "In Progress" ? (
                <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ backgroundColor: color }} />
                    <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                </span>
            ) : null}
            {status}
        </span>
    );
}
