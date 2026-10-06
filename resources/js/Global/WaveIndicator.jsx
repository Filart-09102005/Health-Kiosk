import { motion } from "framer-motion";

/**
 * Indeterminate "work in progress" mark — bars rising and falling in sequence.
 *
 * Used instead of a spinning circle wherever the duration is unknown. Sized to
 * the same box an icon occupies so swapping it in never changes a button's
 * width.
 */
export default function WaveIndicator({ size = 16, color = "var(--color-primary)", bars = 4, className = "" }) {
    return (
        <span
            aria-hidden="true"
            className={`inline-flex items-end justify-center gap-[2px] ${className}`}
            style={{ height: size, width: size }}
        >
            {Array.from({ length: bars }, (_, bar) => (
                <motion.span
                    key={bar}
                    className="w-[2px] rounded-full"
                    style={{ backgroundColor: color }}
                    animate={{ height: ["25%", "85%", "25%"], opacity: [0.55, 1, 0.55] }}
                    transition={{
                        duration: 0.9,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: bar * 0.11,
                    }}
                />
            ))}
        </span>
    );
}
