import { FileSearch } from "lucide-react";
import { motion } from "framer-motion";

export default function EmptyState({ title = "No reports found", description = "There are no reports for the selected filters." }) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex min-h-[22rem] flex-col items-center justify-center rounded-[14px] border p-8 text-center shadow-xl"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
            <div className="flex h-14 w-14 items-center justify-center rounded-[14px] border" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                <FileSearch size={22} />
            </div>
            <h3 className="mt-4 text-xl font-black">{title}</h3>
            <p className="mt-2 max-w-md text-sm font-bold leading-6" style={{ color: "var(--color-muted)" }}>{description}</p>
        </motion.section>
    );
}
