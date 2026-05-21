import SectionHeader from "./SectionHeader";

export default function ReportAnalyticsChart() {
    return (
        <div className="rounded-[14px] border p-5" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <SectionHeader title="Report analytics" description="Export and generation momentum." />
            <div className="mt-5 h-36 rounded-[12px] border p-3" style={{ borderColor: "var(--color-border)", background: "linear-gradient(180deg, color-mix(in srgb, var(--color-primary) 22%, transparent), transparent)" }}>
                <svg viewBox="0 0 320 120" className="h-full w-full" preserveAspectRatio="none">
                    <path d="M0 92 C40 70 60 88 96 54 C132 20 158 66 190 42 C232 10 254 46 320 24" fill="none" stroke="var(--color-primary)" strokeWidth="5" strokeLinecap="round" />
                    <path d="M0 92 C40 70 60 88 96 54 C132 20 158 66 190 42 C232 10 254 46 320 24 L320 120 L0 120 Z" fill="color-mix(in srgb, var(--color-primary) 22%, transparent)" />
                </svg>
            </div>
        </div>
    );
}
