import ReportsOverviewCard from "./ReportsOverviewCard";

export default function ReportsOverviewGrid({ metrics = [] }) {
    return (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => <ReportsOverviewCard key={metric.label} metric={metric} />)}
        </section>
    );
}
