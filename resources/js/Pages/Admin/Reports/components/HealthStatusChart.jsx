import SectionHeader from "./SectionHeader";

const rows = [["Normal", 72, "var(--color-success)"], ["Watch", 18, "var(--color-primary)"], ["Alert", 7, "var(--color-error)"], ["Incomplete", 3, "var(--color-muted)"]];

export default function HealthStatusChart() {
    return (
        <div className="rounded-[14px] border p-5" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <SectionHeader title="Health status" description="Status mix inside selected reports." />
            <div className="mt-5 space-y-4">
                {rows.map(([label, value, color]) => (
                    <div key={label}>
                        <div className="mb-2 flex justify-between text-xs font-black"><span>{label}</span><span style={{ color: "var(--color-muted)" }}>{value}%</span></div>
                        <div className="h-2 rounded-full" style={{ backgroundColor: "var(--color-surface)" }}><div className="h-2 rounded-full" style={{ width: `${value}%`, backgroundColor: color }} /></div>
                    </div>
                ))}
            </div>
        </div>
    );
}
