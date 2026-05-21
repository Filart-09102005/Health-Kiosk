import SectionHeader from "./SectionHeader";

export default function AlertResponseChart() {
    return (
        <div className="rounded-[14px] border p-5" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <SectionHeader title="Response target" description="Clinic response SLA performance." />
            <div className="mt-5 flex items-center justify-center">
                <div className="relative flex h-36 w-36 items-center justify-center rounded-full" style={{ background: "conic-gradient(var(--color-success) 0 78%, var(--color-surface) 78% 100%)" }}>
                    <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full" style={{ backgroundColor: "var(--color-card)" }}>
                        <span className="text-3xl font-black">78%</span>
                        <span className="text-xs font-black" style={{ color: "var(--color-muted)" }}>on time</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
