import { motion, useReducedMotion } from "framer-motion";
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    CircleDashed,
    Radio,
    RadioTower,
    Stethoscope,
    TrendingDown,
    TrendingUp,
    UsersRound,
} from "lucide-react";
import { cardClassName, cardStyle } from "../utils/surface";

const iconMap = {
    students: UsersRound,
    teachers: Stethoscope,
    checks: Activity,
    alerts: AlertTriangle,
    completed: CheckCircle2,
    incomplete: CircleDashed,
    active: Radio,
    devices: RadioTower,
};

export default function StatCard({ stat, index = 0 }) {
    const shouldReduceMotion = useReducedMotion();
    const Icon = iconMap[stat.icon] || Activity;
    const TrendIcon = stat.trend === "down" ? TrendingDown : TrendingUp;
    const trendColor = stat.trend === "down" ? "var(--color-error)" : stat.trend === "up" ? "var(--color-success)" : "var(--color-muted)";

    return (
        <motion.article
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 26, scale: 0.975 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={shouldReduceMotion ? { duration: 0.01 } : { delay: 0.52 + index * 0.08, duration: 0.52, ease: [0.16, 1, 0.3, 1] }}
            whileHover={shouldReduceMotion ? undefined : { y: -4 }}
            className={`${cardClassName} transform-gpu p-5 will-change-transform`}
            style={cardStyle}
        >
            <div className="flex items-start justify-between gap-3">
                <div
                    className="flex h-11 w-11 items-center justify-start"
                    style={{ color: "var(--color-primary)" }}
                >
                    <Icon size={24} strokeWidth={2.2} />
                </div>
                {stat.trend !== "neutral" ? (
                    <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.68rem] font-black"
                        style={{ color: trendColor, backgroundColor: "color-mix(in srgb, currentColor 12%, transparent)" }}
                    >
                        <TrendIcon size={12} />
                        {Math.abs(stat.change)}%
                    </span>
                ) : (
                    <span className="rounded-full px-2.5 py-1 text-[0.68rem] font-black" style={{ color: "var(--color-muted)", backgroundColor: "var(--color-surface)" }}>
                        Stable
                    </span>
                )}
            </div>
            <p className="mt-5 text-3xl font-black tracking-tight">{stat.value.toLocaleString()}</p>
            <p className="mt-1 text-sm font-bold" style={{ color: "var(--color-muted)" }}>
                {stat.label}
            </p>
            <p className="mt-2 text-xs font-semibold" style={{ color: "var(--color-muted)" }}>
                {stat.trend === "up" ? "Increased" : stat.trend === "down" ? "Decreased" : "No change"} vs last week
            </p>
        </motion.article>
    );
}
