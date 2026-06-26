import AlertsOverviewCard from "./AlertsOverviewCard";

export default function AlertsOverviewGrid({ metrics = [] }) {
    return (
        <section className="grid gap-4 md:grid-cols-3">
            {metrics.map((metric, index) => (
                <AlertsOverviewCard key={metric.label} metric={metric} index={index} />
            ))}
        </section>
    );
}
