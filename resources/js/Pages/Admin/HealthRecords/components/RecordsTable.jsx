import { motion } from "framer-motion";
import { cardClassName, cardStyle } from "../utils/surface";
import Pagination from "./Pagination";
import RecordTableRow from "./RecordTableRow";
import SectionHeader from "./SectionHeader";

const columns = [
    "School ID",
    "Full Name",
    "Role",
    "Temp",
    "HR",
    "SpO2",
    "Height",
    "Weight",
    "BMI",
    "Health",
    "Session",
    "Recorded",
    "Actions",
];

export default function RecordsTable({ records, page, totalPages, onPageChange, onViewDetails, totalLabel }) {
    return (
        <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`${cardClassName} overflow-hidden p-5`}
            style={cardStyle}
        >
            <SectionHeader
                title="Health records table"
                description={totalLabel}
            />
            <div className="max-h-[32rem] overflow-auto rounded-xl border" style={{ borderColor: "var(--color-border)" }}>
                <table className="w-full min-w-[1200px] text-left text-sm">
                    <thead className="sticky top-0 z-10 backdrop-blur-xl" style={{ backgroundColor: "color-mix(in srgb, var(--color-card) 96%, transparent)" }}>
                        <tr style={{ color: "var(--color-muted)" }}>
                            {columns.map((heading) => (
                                <th key={heading} className="border-b px-3 py-3 text-[0.65rem] font-black uppercase tracking-wide" style={{ borderColor: "var(--color-border)" }}>
                                    {heading}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((record) => (
                            <RecordTableRow key={record.id} record={record} onViewDetails={onViewDetails} />
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-4">
                <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
            </div>
        </motion.article>
    );
}
