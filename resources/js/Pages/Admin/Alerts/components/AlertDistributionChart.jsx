import SectionHeader from "./SectionHeader";

const items = [
    ["Temperature", "42%"],
    ["SpO2", "25%"],
    ["Heart Rate", "33%"],
];

export default function AlertDistributionChart() {
    return (
        <div className="rounded-[1.25rem] border p-5" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <SectionHeader title="Alert distribution" description="Measurement types triggering abnormal readings." />
            <div className="mt-5 flex items-center gap-6">
                <div
                    className="h-32 w-32 rounded-full"
                    style={{ background: "conic-gradient(var(--color-error) 0 42%, var(--color-primary) 42% 67%, var(--color-success) 67% 88%, var(--color-muted) 88% 100%)" }}
                />
                <div className="flex-1 space-y-3">
                    {items.map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between text-sm font-black">
                            <span style={{ color: "var(--color-muted)" }}>{label}</span>
                            <span>{value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
