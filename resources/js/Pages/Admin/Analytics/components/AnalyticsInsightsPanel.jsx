import InsightCard from "./InsightCard";
import SectionHeader from "./SectionHeader";

export default function AnalyticsInsightsPanel({ data }) {
    const sessions = data?.session_analytics || [];
    const alerts = data?.common_alerts || [];
    const heatmap = data?.heatmap || [];
    const completed = sessions.find((item) => item.name === "Completed")?.value || 0;
    const incomplete = sessions.find((item) => item.name === "Incomplete")?.value || 0;
    const totalSessions = completed + incomplete;
    const totalAlerts = alerts.reduce((sum, item) => sum + item.count, 0);
    const totalHeatmap = heatmap.flatMap((row) => row.hours || []).reduce((sum, value) => sum + value, 0);
    const insights = [
        {
            title: "Session completion",
            value: `${totalSessions ? Math.round((completed / totalSessions) * 100) : 0}%`,
            detail: `${completed.toLocaleString()} completed of ${totalSessions.toLocaleString()} kiosk sessions.`,
            trend: "neutral",
            change: 0,
        },
        {
            title: "Incomplete sessions",
            value: incomplete.toLocaleString(),
            detail: "Sessions that have not reached completed status.",
            trend: "neutral",
            change: 0,
        },
        {
            title: "Alert volume",
            value: totalAlerts.toLocaleString(),
            detail: `${alerts.length} alert type${alerts.length === 1 ? "" : "s"} detected from health records.`,
            trend: "neutral",
            change: 0,
        },
        {
            title: "Measurement activity",
            value: totalHeatmap.toLocaleString(),
            detail: "Kiosk session activity counted across the weekly heatmap.",
            trend: "neutral",
            change: 0,
        },
    ];

    return (
        <section>
            <SectionHeader title="Analytics insights" description="Automated clinic intelligence from kiosk measurement patterns." />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {insights.map((insight, index) => (
                    <InsightCard key={insight.title} insight={insight} index={index} />
                ))}
            </div>
        </section>
    );
}
