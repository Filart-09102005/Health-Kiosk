import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { cardClassName, cardStyle } from "../utils/surface";

const copy = {
    default: { title: "No analytics data", message: "Measurement analytics will appear once kiosk activity is captured." },
    charts: { title: "No charts available", message: "Adjust your date range or filters to load visualization data." },
    filters: { title: "No matching filters", message: "Try broadening filters to view more measurement analytics." },
    alerts: { title: "No alerts found", message: "There are no alert events for the selected period." },
    measurements: { title: "No measurements found", message: "No measurement events match the current criteria." },
};

export default function EmptyState({ variant = "default" }) {
    const text = copy[variant] || copy.default;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col items-center px-6 py-16 text-center ${cardClassName}`} style={cardStyle}>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: "var(--color-surface)", color: "var(--color-muted)" }}>
                <BarChart3 size={28} />
            </div>
            <p className="mt-5 text-lg font-black">{text.title}</p>
            <p className="mt-2 max-w-md text-sm leading-6" style={{ color: "var(--color-muted)" }}>{text.message}</p>
        </motion.div>
    );
}
