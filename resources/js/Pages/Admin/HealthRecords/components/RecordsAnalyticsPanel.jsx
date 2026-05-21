import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { recordsAnalytics } from "../data/demoData";
import { cardClassName, cardStyle } from "../utils/surface";
import HealthStatusDistribution from "./HealthStatusDistribution";
import MeasurementCompletionCard from "./MeasurementCompletionCard";
import SectionHeader from "./SectionHeader";

export default function RecordsAnalyticsPanel() {
    return (
        <section>
            <SectionHeader
                title="Records analytics"
                description="Mini insights for screening outcomes, completion, and clinic alerts."
            />
            <div className="grid gap-4 lg:grid-cols-3">
                <HealthStatusDistribution />
                <MeasurementCompletionCard />
                <motion.article
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`${cardClassName} p-4`}
                    style={cardStyle}
                >
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={16} style={{ color: "var(--color-error)" }} />
                        <p className="text-sm font-black">Most common alerts</p>
                    </div>
                    <ul className="mt-4 space-y-3">
                        {recordsAnalytics.topAlerts.map((alert) => (
                            <li key={alert.label} className="flex items-center justify-between rounded-xl border px-3 py-2.5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                                <span className="text-xs font-bold">{alert.label}</span>
                                <span className="text-xs font-black" style={{ color: "var(--color-error)" }}>{alert.count}</span>
                            </li>
                        ))}
                    </ul>
                </motion.article>
            </div>
        </section>
    );
}
