import { overviewMetrics } from "../data/demoData";
import AnalyticsOverviewCard from "./AnalyticsOverviewCard";

export default function AnalyticsOverviewGrid() {
    return (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {overviewMetrics.map((metric, index) => (
                <AnalyticsOverviewCard key={metric.key} metric={metric} index={index} />
            ))}
        </section>
    );
}
