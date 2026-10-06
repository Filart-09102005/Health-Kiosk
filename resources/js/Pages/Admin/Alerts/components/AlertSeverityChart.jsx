import SectionHeader from "./SectionHeader";

const rows = [
    ["Critical", 28, "var(--color-error)"],
    ["High", 46, "var(--color-primary)"],
    ["Medium", 62, "var(--color-success)"],
    ["Low", 34, "var(--color-muted)"],
];

export default function AlertSeverityChart() {
    return (
        <div className="rounded-[1.25rem] border p-5" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <SectionHeader title="Severity load" description="Open alert pressure by severity." />
            <div className="mt-5 space-y-4">
                {rows.map(([label, value, color]) => (
                    <div key={label}>
                        <div className="mb-2 flex justify-between text-xs font-black">
                            <span>{label}</span>
                            <span style={{ color: "var(--color-muted)" }}>{value}%</span>
                        </div>
                        <div className="h-2 rounded-full" style={{ backgroundColor: "var(--color-surface)" }}>
                            <div className="h-2 rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
