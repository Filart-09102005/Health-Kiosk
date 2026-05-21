import { motion, useReducedMotion } from "framer-motion";
import { cardClassName, cardStyle } from "../utils/surface";

export default function ChartCard({ title, description, children, className = "" }) {
    const shouldReduceMotion = useReducedMotion();

    return (
        <motion.article
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 0.28, ease: "easeOut" }}
            className={`${cardClassName} p-5 ${className}`}
            style={cardStyle}
        >
            <div className="mb-4">
                <h3 className="text-sm font-black">{title}</h3>
                {description ? (
                    <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>
                        {description}
                    </p>
                ) : null}
            </div>
            <div className="h-[240px] w-full sm:h-[260px]">{children}</div>
        </motion.article>
    );
}
