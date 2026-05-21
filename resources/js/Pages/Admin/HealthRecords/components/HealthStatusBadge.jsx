const toneMap = {
    Normal: "success",
    Watch: "primary",
    Alert: "error",
};

const colorVar = {
    success: "var(--color-success)",
    primary: "var(--color-primary)",
    error: "var(--color-error)",
};

export default function HealthStatusBadge({ status }) {
    const color = colorVar[toneMap[status]] || "var(--color-muted)";

    return (
        <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-wide"
            style={{ color, backgroundColor: "color-mix(in srgb, currentColor 12%, transparent)" }}
        >
            {status}
        </span>
    );
}
