import HealthStatusChart from "./HealthStatusChart";
import MeasurementTrendChart from "./MeasurementTrendChart";
import ReportAnalyticsChart from "./ReportAnalyticsChart";
import ReportDistributionChart from "./ReportDistributionChart";
import SectionHeader from "./SectionHeader";

export default function ReportStatisticsPanel() {
    return (
        <section className="rounded-[14px] border p-5 shadow-xl" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <SectionHeader eyebrow="Analytics" title="Reporting analytics" description="Demo charts for export volume, health status, measurement trends, and report distribution." />
            <div className="mt-5 grid gap-5 xl:grid-cols-4">
                <ReportDistributionChart />
                <HealthStatusChart />
                <MeasurementTrendChart />
                <ReportAnalyticsChart />
            </div>
        </section>
    );
}
