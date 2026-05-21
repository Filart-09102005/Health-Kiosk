import { insights } from "../data/demoData";
import InsightCard from "./InsightCard";
import SectionHeader from "./SectionHeader";

export default function AnalyticsInsightsPanel() {
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
