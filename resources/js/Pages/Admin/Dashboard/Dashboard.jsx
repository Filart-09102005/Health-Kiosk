import { motion, useReducedMotion } from "framer-motion";
import DashboardCharts from "./components/DashboardCharts";
import StatsGrid from "./components/StatsGrid";
import WelcomeBanner from "./components/WelcomeBanner";

export default function Dashboard() {
    const shouldReduceMotion = useReducedMotion();

    return (
        <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 0.24, ease: "easeOut" }}
            className="mt-6 space-y-6"
        >
            <WelcomeBanner />
            <StatsGrid />
            <DashboardCharts />
        </motion.div>
    );
}
