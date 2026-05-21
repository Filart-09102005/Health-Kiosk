import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cardClassName, cardStyle } from "../utils/surface";

export default function InsightCard({ insight, index = 0 }) {
    const TrendIcon = insight.trend === "down" ? TrendingDown : TrendingUp;
    const color = insight.trend === "down" ? "var(--color-error)" : insight.trend === "up" ? "var(--color-success)" : "var(--color-muted)";

    return (
        <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} whileHover={{ y: -2 }} className={`${cardClassName} p-4`} style={cardStyle}>
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
