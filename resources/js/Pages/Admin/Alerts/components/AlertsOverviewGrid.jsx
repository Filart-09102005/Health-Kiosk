import AlertsOverviewCard from "./AlertsOverviewCard";

export default function AlertsOverviewGrid({ metrics = [] }) {
    return (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric, index) => (
                <AlertsOverviewCard key={metric.label} metric={metric} index={index} />
            ))}
        </section>
    );
}
