import { FileText } from "lucide-react";
import { motion } from "framer-motion";

export default function ReportsHeader() {
    return (
        <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[14px] border p-6 shadow-xl"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[14px] border" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                        <FileText size={24} style={{ color: "var(--color-primary)" }} />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-primary)" }}>Admin / Reports</p>
                        <h1 className="mt-2 text-4xl font-black tracking-tight">Clinic Reports</h1>
                        <p className="mt-2 max-w-3xl text-sm font-bold leading-6" style={{ color: "var(--color-muted)" }}>
                            Generate health summaries, export clinic analytics, and review reporting activity from kiosk sessions.
                        </p>
                    </div>
                </div>
                <div className="rounded-[14px] border px-4 py-3" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                    <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--color-muted)" }}>Reporting status</p>
                    <p className="mt-1 text-2xl font-black">Operational</p>
                </div>
            </div>
        </motion.section>
    );
}
