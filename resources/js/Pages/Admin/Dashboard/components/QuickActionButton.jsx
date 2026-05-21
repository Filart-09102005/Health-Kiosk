import { motion } from "framer-motion";
import {
    AlertTriangle,
    FileDown,
    FileText,
    GraduationCap,
    Stethoscope,
} from "lucide-react";

const iconMap = {
    report: FileText,
    student: GraduationCap,
    teacher: Stethoscope,
    export: FileDown,
    alerts: AlertTriangle,
};

export default function QuickActionButton({ action, index = 0 }) {
    const Icon = iconMap[action.icon] || FileText;

    return (
        <motion.button
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            whileHover={{ y: -3 }}
            className="flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition hk-soft-hover"
            style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
            }}
        >
            <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, transparent)", color: "var(--color-primary)" }}
            >
                <Icon size={18} />
            </span>
            <span>
                <span className="block text-sm font-black">{action.label}</span>
                <span className="mt-1 block text-xs font-semibold" style={{ color: "var(--color-muted)" }}>
                    {action.description}
                </span>
            </span>
        </motion.button>
    );
}
