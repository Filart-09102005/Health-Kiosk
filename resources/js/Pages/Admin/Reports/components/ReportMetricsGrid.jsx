import ReportMetricCard from "./ReportMetricCard";
import SectionHeader from "./SectionHeader";

const metrics = [
    ["Most exported type", "PDF", "Used for printable clinic summaries"],
    ["Common alert report", "Temperature", "Most requested abnormal-reading report"],
    ["Active reporting day", "Tuesday", "Highest report volume this week"],
    ["Monitored metric", "BMI", "Top recurring analytics section"],
    ["Report volume", "426", "Highest weekly generated count"],
    ["Completion rate", "99.2%", "Successful export completion"],
];

export default function ReportMetricsGrid() {
    return (
        <section className="rounded-[14px] border p-5 shadow-xl" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <SectionHeader eyebrow="Insights" title="Reporting insights" description="Key export, volume, and template usage indicators." />
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {metrics.map(([label, value, caption]) => <ReportMetricCard key={label} label={label} value={value} caption={caption} />)}
            </div>
        </section>
    );
}
