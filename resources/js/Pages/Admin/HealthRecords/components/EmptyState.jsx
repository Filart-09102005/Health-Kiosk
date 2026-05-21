import { motion } from "framer-motion";
import { ClipboardList } from "lucide-react";
import { cardClassName, cardStyle } from "../utils/surface";

const presets = {
    default: {
        title: "No health records yet",
        message: "Kiosk screenings will appear here once students and faculty complete measurements.",
    },
    search: {
        title: "No search results",
        message: "Try adjusting your keywords or clearing active filters to find matching records.",
    },
    filters: {
        title: "No records match filters",
        message: "Broaden your date range or reset filters to view more clinic records.",
    },
    alerts: {
        title: "No alert records",
        message: "There are currently no alert-level screenings in this view.",
    },
    incomplete: {
        title: "No incomplete records",
        message: "All visible sessions have completed the required measurement modules.",
    },
};

export default function EmptyState({ variant = "default" }) {
    const copy = presets[variant] || presets.default;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col items-center justify-center px-6 py-16 text-center ${cardClassName}`}
            style={cardStyle}
        >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: "var(--color-surface)", color: "var(--color-muted)" }}>
                <ClipboardList size={28} />
            </div>
            <p className="mt-5 text-lg font-black">{copy.title}</p>
            <p className="mt-2 max-w-md text-sm leading-6" style={{ color: "var(--color-muted)" }}>
                {copy.message}
            </p>
        </motion.div>
    );
}
