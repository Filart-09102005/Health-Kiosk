import { motion, useReducedMotion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cardClassName, cardStyle } from "../utils/surface";

const metricCardClassName = cardClassName.replace(" transition hk-soft-hover", "");

export default function InsightCard({ insight }) {
    const shouldReduceMotion = useReducedMotion();
    const TrendIcon = insight.trend === "down" ? TrendingDown : TrendingUp;
    const color = insight.trend === "down" ? "var(--color-error)" : insight.trend === "up" ? "var(--color-success)" : "var(--color-muted)";

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
            <p className="text-xs font-black uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>{insight.title}</p>
            <p className="mt-2 text-lg font-black">{insight.value}</p>
            <p className="mt-1 text-xs leading-5" style={{ color: "var(--color-muted)" }}>{insight.detail}</p>
            {insight.trend !== "neutral" ? (
                <p className="mt-3 inline-flex items-center gap-1 text-xs font-black" style={{ color }}>
                    <TrendIcon size={12} />{insight.change}% vs last period
                </p>
            ) : null}
        </motion.article>
    );
}
