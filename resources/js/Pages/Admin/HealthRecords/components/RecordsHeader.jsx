import { motion } from "framer-motion";
import { ChevronRight, ClipboardList } from "lucide-react";
import { cardClassName, cardStyle } from "../utils/surface";

export default function RecordsHeader() {
    return (
        <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`${cardClassName} p-5 sm:p-6`}
            style={cardStyle}
        >
            <nav className="flex flex-wrap items-center gap-1 text-xs font-bold" style={{ color: "var(--color-muted)" }} aria-label="Breadcrumb">
                <span>Admin</span>
                <ChevronRight size={12} />
                <span style={{ color: "var(--color-primary)" }}>Health Records</span>
            </nav>
            <div className="mt-4">
                <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: "var(--color-primary)" }}>
                        <ClipboardList size={22} />
                    </span>
                    <div>
                        <h2 className="text-xl font-black sm:text-2xl">Health Records</h2>
                        <p className="mt-1 max-w-2xl text-sm leading-6" style={{ color: "var(--color-muted)" }}>
                            Review kiosk vitals, BMI summaries, session accountability, incomplete measurements, and printable clinic receipts.
                        </p>
                    </div>
                </div>
            </div>
        </motion.section>
    );
}
