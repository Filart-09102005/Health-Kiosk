const toneMap = {
    Normal: "success",
    Completed: "success",
    online: "success",
    Resolved: "success",
    Open: "error",
    Alert: "error",
    "High Risk": "error",
    high: "error",
    Incomplete: "error",
    offline: "error",
    Watch: "primary",
    "Needs Review": "primary",
    Reviewing: "primary",
    medium: "primary",
    warning: "primary",
    Measuring: "primary",
    Waiting: "muted",
    Starting: "muted",
    low: "muted",
};

const colorVar = {
    success: "var(--color-success)",
    error: "var(--color-error)",
    primary: "var(--color-primary)",
    muted: "var(--color-muted)",
};

export default function StatusBadge({ label, tone }) {
    const resolvedTone = tone || toneMap[label] || "muted";
    const color = colorVar[resolvedTone] || colorVar.muted;
    const displayLabel = label === "Watch" ? "Needs Review" : label === "Alert" ? "High Risk" : label;

    return (
        <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-wide"
            style={{
                color,
                backgroundColor: "color-mix(in srgb, currentColor 12%, transparent)",
            }}
        >
            {typeof displayLabel === "string" ? displayLabel.charAt(0).toUpperCase() + displayLabel.slice(1) : displayLabel}
        </span>
    );
}
