import { recordsStats } from "../data/demoData";
import RecordsStatCard from "./RecordsStatCard";

export default function RecordsStatsGrid() {
    return (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {recordsStats.map((stat, index) => (
                <RecordsStatCard key={stat.key} stat={stat} index={index} />
            ))}
        </section>
    );
}
