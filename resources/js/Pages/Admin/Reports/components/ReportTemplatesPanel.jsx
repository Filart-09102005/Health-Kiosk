import ReportTemplateCard from "./ReportTemplateCard";
import SectionHeader from "./SectionHeader";

const templates = [
    ["Health Monitoring Report", "Daily vital signs, BMI, and kiosk completion summary."],
    ["BMI Summary Report", "Weight, height, BMI category, and trend-oriented overview."],
    ["Alert Monitoring Report", "Abnormal readings, severity mix, and review state."],
    ["Session Analytics Report", "Kiosk session volume, completion, and retry overview."],
    ["Student Health Report", "Student-only summary grouped by department and status."],
    ["Teacher Health Report", "Faculty wellness summary and clinic monitoring snapshot."],
];

export default function ReportTemplatesPanel() {
    return (
        <section className="rounded-[14px] border p-5 shadow-xl" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <SectionHeader eyebrow="Templates" title="Report templates" description="Reusable reporting layouts for clinic workflows." />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
                {templates.map(([title, description]) => <ReportTemplateCard key={title} title={title} description={description} />)}
            </div>
        </section>
    );
}
