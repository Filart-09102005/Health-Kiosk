import { dashboardStats } from "../data/demoData";
import StatCard from "./StatCard";

export default function StatsGrid() {
    return (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {dashboardStats.map((stat, index) => (
                <StatCard key={stat.key} stat={stat} index={index} />
            ))}
        </section>
    );
}
