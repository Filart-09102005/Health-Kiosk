import AlertDistributionChart from "./AlertDistributionChart";
import AlertHeatmapChart from "./AlertHeatmapChart";
import AlertResponseChart from "./AlertResponseChart";
import AlertSeverityChart from "./AlertSeverityChart";
import AlertStatisticsPanel from "./AlertStatisticsPanel";
import AlertTrendChart from "./AlertTrendChart";
import SectionHeader from "./SectionHeader";

export default function AlertAnalyticsPanel() {
    return (
        <section className="rounded-[14px] border p-5 shadow-xl" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <SectionHeader eyebrow="Analytics" title="Alert monitoring intelligence" description="Demo-only visual analytics for clinic triage and kiosk supervision." />
            <div className="mt-5 grid gap-5 xl:grid-cols-3">
                <AlertDistributionChart />
                <AlertTrendChart />
                <AlertSeverityChart />
                <AlertResponseChart />
                <AlertHeatmapChart />
                <AlertStatisticsPanel />
            </div>
        </section>
    );
}
