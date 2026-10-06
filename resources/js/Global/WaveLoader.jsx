import { motion } from "framer-motion";

export default function WaveLoader({ size = 5, color = "currentColor", className = "" }) {
    const dotVariants = {
        start: { y: 0 },
        end: { y: -5 },
    };

    const containerVariants = {
        start: { transition: { staggerChildren: 0.15 } },
        end: { transition: { staggerChildren: 0.15 } },
    };

    return (
        <motion.div
            className={`flex items-center justify-center gap-1 ${className}`}
            variants={containerVariants}
            initial="start"
            animate="end"
        >
            {[0, 1, 2].map((i) => (
                <motion.span
                    key={i}
                    variants={dotVariants}
                    transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                    }}
                    className="rounded-full"
                    style={{ width: size, height: size, backgroundColor: color }}
                />
            ))}
        </motion.div>
    );
}
