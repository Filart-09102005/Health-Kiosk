import { motion, useReducedMotion } from "framer-motion";
import RecordsStatCard from "./RecordsStatCard";

export default function RecordsStatsGrid({ stats = [] }) {
    const shouldReduceMotion = useReducedMotion();

    return (
        <motion.section
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
            initial="hidden"
            animate="show"
            layout={false}
            variants={{
                hidden: {},
                show: {
                    transition: shouldReduceMotion
                        ? { staggerChildren: 0 }
                        : { delayChildren: 0.52, staggerChildren: 0.06 },
                },
            }}
        >
            {stats.map((stat) => (
                <RecordsStatCard key={stat.key} stat={stat} />
            ))}
        </motion.section>
    );
}
