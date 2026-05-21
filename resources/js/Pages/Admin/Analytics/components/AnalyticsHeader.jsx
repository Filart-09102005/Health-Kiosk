import { motion } from "framer-motion";
import { BarChart3, ChevronRight } from "lucide-react";
import { cardClassName, cardStyle } from "../utils/surface";

export default function AnalyticsHeader() {
    return (
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`${cardClassName} p-5 sm:p-6`} style={cardStyle}>
            <nav className="flex flex-wrap items-center gap-1 text-xs font-bold" style={{ color: "var(--color-muted)" }}>
                <span>Admin</span><ChevronRight size={12} /><span style={{ color: "var(--color-primary)" }}>Measurement Analytics</span>
            </nav>
            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: "var(--color-primary)" }}><BarChart3 size={22} /></span>
                    <div>
                        <h2 className="text-xl font-black sm:text-2xl">Measurement Analytics</h2>
                        <p className="mt-1 max-w-2xl text-sm leading-6" style={{ color: "var(--color-muted)" }}>
                            Monitor vitals trends, kiosk performance, session quality, and clinic health insights from kiosk telemetry.
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-black">
                    <span className="rounded-full px-3 py-1.5" style={{ backgroundColor: "var(--color-surface)" }}>342 measurements today</span>
                    <span className="rounded-full px-3 py-1.5" style={{ color: "var(--color-success)", backgroundColor: "color-mix(in srgb, var(--color-success) 12%, transparent)" }}>93% completion</span>
                </div>
            </div>
        </motion.section>
    );
}
