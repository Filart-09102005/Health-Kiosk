import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { cardClassName, cardStyle } from "../utils/surface";
import HealthStatusDistribution from "./HealthStatusDistribution";
import SectionHeader from "./SectionHeader";

export default function RecordsAnalyticsPanel({ analytics }) {
    const shouldReduceMotion = useReducedMotion();
    const topAlerts = analytics?.topAlerts || [];

    return (
        <motion.section
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldReduceMotion ? { duration: 0.01 } : { delay: 0.92, duration: 0.34, ease: "easeOut" }}
        >
            <SectionHeader
                title="Records analytics"
                description="Mini insights for screening outcomes, completion, and clinic alerts."
            />
            <div className="grid gap-4 lg:grid-cols-2">
                <HealthStatusDistribution data={analytics?.healthStatus || []} />
                <article
                    className={`${cardClassName} p-4`}
                    style={cardStyle}
                >
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={16} style={{ color: "var(--color-error)" }} />
                        <p className="text-sm font-black">Most common alerts</p>
                    </div>
                    <ul className="mt-4 space-y-3">
                        {topAlerts.length === 0 ? (
                            <li className="rounded-xl border px-3 py-2.5 text-xs font-bold" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-muted)" }}>
                                No alert records found.
                            </li>
                        ) : topAlerts.map((alert) => (
                            <li key={alert.label} className="flex items-center justify-between rounded-xl border px-3 py-2.5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                                <span className="text-xs font-bold">{alert.label}</span>
                                <span className="text-xs font-black" style={{ color: "var(--color-error)" }}>{alert.count}</span>
                            </li>
                        ))}
                    </ul>
                </article>
            </div>
        </motion.section>
    );
}
