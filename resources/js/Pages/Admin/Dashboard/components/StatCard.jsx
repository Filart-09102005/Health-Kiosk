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

const metricCardClassName = cardClassName.replace(" transition hk-soft-hover", "");

export default function StatCard({ stat }) {
    const shouldReduceMotion = useReducedMotion();
    const Icon = iconMap[stat.icon] || Activity;
    const TrendIcon = stat.trend === "down" ? TrendingDown : TrendingUp;
    const trendColor = stat.trend === "down" ? "var(--color-error)" : stat.trend === "up" ? "var(--color-success)" : "var(--color-muted)";

    return (
        <motion.article
            layout={false}
            variants={{
                hidden: shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
                show: {
                    opacity: 1,
                    y: 0,
                    transition: shouldReduceMotion
                        ? { duration: 0.01 }
                        : { duration: 0.48, ease: "easeOut" },
                },
                exit: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 },
            }}
            transformTemplate={(_, generated) => `${generated} translateZ(0)`}
            className={`${metricCardClassName} transform-gpu p-5`}
            style={{ ...cardStyle, willChange: "transform, opacity" }}
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
                {stat.description || `${stat.trend === "up" ? "Increased" : stat.trend === "down" ? "Decreased" : "No change"} vs last week`}
            </p>
        </motion.article>
    );
}
