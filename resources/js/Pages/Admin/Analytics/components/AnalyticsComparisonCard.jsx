import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cardClassName, cardStyle } from "../utils/surface";

export default function AnalyticsComparisonCard({ item, index = 0 }) {
    const improved = item.current >= item.previous;
    const Arrow = improved ? ArrowUpRight : ArrowDownRight;
    const color = improved ? "var(--color-success)" : "var(--color-error)";

    return (
        <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className={`${cardClassName} p-4`} style={cardStyle}>
            <p className="text-xs font-black" style={{ color: "var(--color-muted)" }}>{item.label}</p>
            <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                    <p className="text-2xl font-black">{item.current}</p>
                    <p className="text-xs font-bold" style={{ color: "var(--color-muted)" }}>vs {item.previous} {item.unit}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-black" style={{ color, backgroundColor: "color-mix(in srgb, currentColor 12%, transparent)" }}>
                    <Arrow size={14} />
                    {Math.abs(item.current - item.previous)}
                </span>
            </div>
        </motion.article>
    );
}
