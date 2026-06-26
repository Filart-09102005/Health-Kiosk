import { motion, useReducedMotion } from "framer-motion";
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

const metricCardClassName = cardClassName.replace(" transition hk-soft-hover", "");

export default function RecordsStatCard({ stat }) {
    const shouldReduceMotion = useReducedMotion();
    const Icon = iconMap[stat.icon] || ClipboardList;
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
            className={`${metricCardClassName} transform-gpu p-4`}
            style={{ ...cardStyle, willChange: "transform, opacity" }}
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
