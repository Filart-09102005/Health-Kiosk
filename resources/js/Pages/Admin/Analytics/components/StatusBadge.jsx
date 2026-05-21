const toneMap = { Normal: "success", Watch: "primary", Alert: "error", high: "error", medium: "primary", low: "muted" };
const colors = { success: "var(--color-success)", primary: "var(--color-primary)", error: "var(--color-error)", muted: "var(--color-muted)" };

export default function StatusBadge({ label, tone }) {
    const resolved = tone || toneMap[label] || "muted";

    return (
        <span className="inline-flex rounded-full px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-wide" style={{ color: colors[resolved], backgroundColor: "color-mix(in srgb, currentColor 12%, transparent)" }}>
            {label}
        </span>
    );
}
