import { recordsStats } from "../data/demoData";
import RecordsStatCard from "./RecordsStatCard";

export default function RecordsStatsGrid() {
    // Keep only the counts (total, completed, incomplete, alerts) and exclude biometric averages
    const filteredStats = recordsStats.filter(
        (stat) => !["bmi", "temp", "hr", "spo2"].includes(stat.key)
    );

    return (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {filteredStats.map((stat, index) => (
                <RecordsStatCard key={stat.key} stat={stat} index={index} />
            ))}
        </section>
    );
}
