import { motion, useReducedMotion } from "framer-motion";
import DailyHealthChecksChart from "./DailyHealthChecksChart";
import SectionHeader from "./SectionHeader";
import SessionUsersTable from "./SessionUsersTable";

export default function DashboardCharts({ data, period, onPeriodChange }) {
    const shouldReduceMotion = useReducedMotion();

    return (
        <motion.section
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldReduceMotion ? { duration: 0.01 } : { delay: 1.24, duration: 0.34, ease: "easeOut" }}
        >
            <SectionHeader
                title="Session overview"
                description="Kiosk session activity and users included in today's completion count."
            />
            <div className="grid gap-4">
                <DailyHealthChecksChart data={data?.daily_health_checks || []} period={period} onPeriodChange={onPeriodChange} />
                <SessionUsersTable records={data?.recent_sessions || []} />
            </div>
        </motion.section>
    );
}
