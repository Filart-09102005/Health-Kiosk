import { motion } from "framer-motion";
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    CircleDashed,
    ClipboardList,
    HeartPulse,
    Scale,
    Thermometer,
    TrendingDown,
    TrendingUp,
} from "lucide-react";
import { cardClassName, cardStyle } from "../utils/surface";

const iconMap = {
    records: ClipboardList,
    completed: CheckCircle2,
    incomplete: CircleDashed,
    alerts: AlertTriangle,
    bmi: Scale,
    temp: Thermometer,
    hr: HeartPulse,
    spo2: Activity,
};

export default function RecordsStatCard({ stat, index = 0 }) {
    const Icon = iconMap[stat.icon] || ClipboardList;
    const TrendIcon = stat.trend === "down" ? TrendingDown : TrendingUp;
    const trendColor = stat.trend === "down" ? "var(--color-error)" : stat.trend === "up" ? "var(--color-success)" : "var(--color-muted)";

    return (
        <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.28 }}
            whileHover={{ y: -3 }}
            className={`${cardClassName} p-4`}
            style={cardStyle}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 items-center justify-start" style={{ color: "var(--color-primary)" }}>
                    <Icon size={23} strokeWidth={2.2} />
                </div>
                {stat.trend !== "neutral" ? (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-black" style={{ color: trendColor, backgroundColor: "color-mix(in srgb, currentColor 12%, transparent)" }}>
                        <TrendIcon size={11} />
                        {Math.abs(stat.change)}%
                    </span>
                ) : (
                    <span className="rounded-full px-2 py-0.5 text-[0.65rem] font-black" style={{ color: "var(--color-muted)", backgroundColor: "var(--color-surface)" }}>
                        Stable
                    </span>
                )}
            </div>
            <p className="mt-4 text-2xl font-black tracking-tight">{stat.value}</p>
            <p className="mt-1 text-xs font-bold" style={{ color: "var(--color-muted)" }}>{stat.label}</p>
        </motion.article>
    );
}
