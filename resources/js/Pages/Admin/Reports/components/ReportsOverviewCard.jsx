import { motion } from "framer-motion";

export default function ReportsOverviewCard({ metric }) {
    const Icon = metric.icon;

    return (
        <motion.article
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            className="rounded-[1.25rem] border p-4 hk-admin-card transition"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--color-muted)" }}>{metric.label}</p>
                    <p className="mt-3 text-3xl font-black">{metric.value}</p>
                </div>
                <Icon size={20} style={{ color: "var(--color-primary)" }} />
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-xs font-black" style={{ color: "var(--color-success)" }}>{metric.trend}</span>
                <div className="flex h-7 items-end gap-1">
                    {[32, 54, 42, 68, 58, 76].map((height, index) => (
                        <span key={index} className="w-1.5 rounded-full" style={{ height: `${height}%`, backgroundColor: "color-mix(in srgb, var(--color-primary) 68%, transparent)" }} />
                    ))}
                </div>
            </div>
        </motion.article>
    );
}
