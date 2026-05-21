import { motion } from "framer-motion";
import AlertSeverityBadge from "./AlertSeverityBadge";

export default function AlertsOverviewCard({ metric, index = 0 }) {
    const Icon = metric.icon;

    return (
        <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="rounded-[14px] border p-4 shadow-sm transition hk-soft-hover"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px]" style={{ backgroundColor: "var(--color-surface)" }}>
                    <Icon size={20} />
                </div>
                <AlertSeverityBadge severity={metric.severity} />
            </div>
            <p className="mt-4 text-sm font-bold" style={{ color: "var(--color-muted)" }}>{metric.label}</p>
            <div className="mt-2 flex items-end justify-between gap-3">
                <p className="text-3xl font-black">{metric.value}</p>
                <p className="text-xs font-black" style={{ color: "var(--color-success)" }}>{metric.trend}</p>
            </div>
        </motion.article>
    );
}
