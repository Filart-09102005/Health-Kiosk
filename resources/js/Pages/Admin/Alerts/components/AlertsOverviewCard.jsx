import { motion } from "framer-motion";
export default function AlertsOverviewCard({ metric, index = 0 }) {
    const Icon = metric.icon;

    return (
        <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="rounded-[1.25rem] border p-4 shadow-sm transition hk-soft-hover"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[0.875rem]" style={{ backgroundColor: "var(--color-surface)" }}>
                    <Icon size={20} />
                </div>
            </div>
            <p className="mt-4 text-sm font-bold" style={{ color: "var(--color-muted)" }}>{metric.label}</p>
            <p className="mt-2 text-3xl font-black">{metric.value}</p>
            <p className="mt-1 text-xs font-bold" style={{ color: "var(--color-muted)" }}>{metric.caption}</p>
        </motion.article>
    );
}
