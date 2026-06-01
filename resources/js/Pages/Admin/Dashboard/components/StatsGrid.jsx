import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { dashboardStats } from "../data/demoData";
import StatCard from "./StatCard";

export default function StatsGrid() {
    const shouldReduceMotion = useReducedMotion();
    const metrics = useMemo(() => dashboardStats, []);

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
            {metrics.map((stat) => (
                <StatCard key={stat.key} stat={stat} />
            ))}
        </motion.section>
    );
}
