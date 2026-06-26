import { motion, useReducedMotion } from "framer-motion";
import StatCard from "./StatCard";

export default function StatsGrid({ stats = [] }) {
    const shouldReduceMotion = useReducedMotion();

    return (
        <motion.section
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
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
                <StatCard key={stat.key} stat={stat} />
            ))}
        </motion.section>
    );
}
