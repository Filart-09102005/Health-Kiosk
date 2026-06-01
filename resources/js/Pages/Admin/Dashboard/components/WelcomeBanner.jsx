import { motion, useReducedMotion } from "framer-motion";
import { cardClassName, cardStyle } from "../utils/surface";

export default function WelcomeBanner() {
    const shouldReduceMotion = useReducedMotion();
    const now = new Date();
    const dateLabel = now.toLocaleDateString("en-PH", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    return (
        <motion.section
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={shouldReduceMotion ? { duration: 0.01 } : { delay: 0.08, duration: 0.3, ease: "easeOut" }}
            className={`relative overflow-hidden ${cardClassName} p-6`}
            style={cardStyle}
        >
            <div
                className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-30 blur-3xl"
                style={{ backgroundColor: "var(--color-primary)" }}
            />
            <div className="relative">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-primary)" }}>
                        System overview
                    </p>
                    <h2 className="mt-2 text-2xl font-black sm:text-3xl">Welcome back, Clinic Admin</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: "var(--color-muted)" }}>
                        Monitor kiosk vitals, session throughput, device health, and clinic alerts from a single command center.
                    </p>
                    <p className="mt-3 text-xs font-bold" style={{ color: "var(--color-muted)" }}>
                        {dateLabel}
                    </p>
                </div>
            </div>
        </motion.section>
    );
}
