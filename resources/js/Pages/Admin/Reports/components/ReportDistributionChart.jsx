import SectionHeader from "./SectionHeader";

export default function ReportDistributionChart() {
    return (
        <div className="rounded-[1.25rem] border p-5" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <SectionHeader title="Report distribution" description="Generated report types by volume." />
            <div className="mt-5 flex items-center gap-6">
                <div className="h-28 w-28 rounded-full" style={{ background: "conic-gradient(var(--color-primary) 0 38%, var(--color-success) 38% 64%, var(--color-muted) 64% 82%, var(--color-error) 82% 100%)" }} />
                <div className="flex-1 space-y-3 text-sm font-black">
                    {["Health 38%", "BMI 26%", "Sessions 18%", "Alerts 18%"].map((item) => <p key={item} style={{ color: "var(--color-muted)" }}>{item}</p>)}
                </div>
            </div>
        </div>
    );
}
