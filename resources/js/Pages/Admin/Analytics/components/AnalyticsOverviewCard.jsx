import { motion } from "framer-motion";
import { Activity, AlertTriangle, CheckCircle2, CircleDashed, Clock3, HeartPulse, Percent, Scale, Stethoscope, Thermometer, TrendingDown, TrendingUp } from "lucide-react";
import { cardClassName, cardStyle } from "../utils/surface";

const icons = { temp: Thermometer, hr: HeartPulse, spo2: Activity, bmi: Scale, measure: Stethoscope, completed: CheckCircle2, incomplete: CircleDashed, alerts: AlertTriangle, rate: Percent, duration: Clock3 };

function Sparkline({ points }) {
    const max = Math.max(...points);
    const min = Math.min(...points);
    const range = max - min || 1;
    const coords = points.map((p, i) => `${(i / (points.length - 1)) * 100},${100 - ((p - min) / range) * 100}`).join(" ");

    return (
        <svg viewBox="0 0 100 100" className="h-10 w-full" preserveAspectRatio="none">
            <polyline fill="none" stroke="var(--color-primary)" strokeWidth="3" points={coords} />
        </svg>
    );
}

export default function AnalyticsOverviewCard({ metric, index = 0 }) {
    const Icon = icons[metric.icon] || Activity;
    const TrendIcon = metric.trend === "down" ? TrendingDown : TrendingUp;
    const trendColor = metric.trend === "down" ? "var(--color-error)" : metric.trend === "up" ? "var(--color-success)" : "var(--color-muted)";

    return (
        <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.025 }} whileHover={{ y: -3 }} className={`${cardClassName} p-4`} style={cardStyle}>
            <div className="flex items-start justify-between gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: "var(--color-surface)", color: "var(--color-primary)" }}><Icon size={18} /></span>
                {metric.trend !== "neutral" ? (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-black" style={{ color: trendColor, backgroundColor: "color-mix(in srgb, currentColor 12%, transparent)" }}>
                        <TrendIcon size={11} />{Math.abs(metric.change)}%
                    </span>
                ) : null}
            </div>
            <p className="mt-3 text-xl font-black">{metric.value}</p>
            <p className="mt-1 text-xs font-bold" style={{ color: "var(--color-muted)" }}>{metric.label}</p>
            <div className="mt-3 opacity-80"><Sparkline points={metric.spark} /></div>
        </motion.article>
    );
}
