import { comparisons } from "../data/demoData";
import AnalyticsComparisonCard from "./AnalyticsComparisonCard";
import AverageMeasurementsCard from "./AverageMeasurementsCard";
import CompletionRateCard from "./CompletionRateCard";
import SectionHeader from "./SectionHeader";

export default function MeasurementPerformancePanel() {
    return (
        <section>
            <SectionHeader title="Performance & comparison" description="Session throughput and period-over-period analytics." />
            <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <CompletionRateCard />
                <AverageMeasurementsCard />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {comparisons.map((item, index) => (
                    <AnalyticsComparisonCard key={item.label} item={item} index={index} />
                ))}
            </div>
        </section>
    );
}
