import { Printer } from "lucide-react";
import { recentHealthRecords } from "../data/demoData";
import { cardClassName, cardStyle } from "../utils/surface";
import SectionHeader from "./SectionHeader";
import StatusBadge from "./StatusBadge";
import TableControls from "./TableControls";

export default function RecentHealthRecordsTable({ records = recentHealthRecords }) {
    if (! records.length) {
        return null;
    }

    return (
        <article className={`${cardClassName} p-5`} style={cardStyle}>
            <SectionHeader title="Recent health records" description="Latest kiosk screenings with vitals and clinical status." />
            <TableControls searchPlaceholder="Search health records..." />
            <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                    <thead>
                        <tr style={{ color: "var(--color-muted)" }}>
                            {["User", "Barcode", "Vitals", "BMI", "Status", "Time", "Action"].map((heading) => (
                                <th key={heading} className="border-b px-3 py-3 text-xs font-black uppercase tracking-wide" style={{ borderColor: "var(--color-border)" }}>
                                    {heading}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((record) => (
                            <tr key={record.id} className="transition hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,transparent)]">
                                <td className="border-b px-3 py-4 font-black" style={{ borderColor: "var(--color-border)" }}>{record.name}</td>
                                <td className="border-b px-3 py-4" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>{record.barcode}</td>
                                <td className="border-b px-3 py-4" style={{ borderColor: "var(--color-border)" }}>{record.vitals}</td>
                                <td className="border-b px-3 py-4 font-black" style={{ borderColor: "var(--color-border)" }}>{record.bmi}</td>
                                <td className="border-b px-3 py-4" style={{ borderColor: "var(--color-border)" }}>
                                    <StatusBadge label={record.status} />
                                </td>
                                <td className="border-b px-3 py-4 text-xs font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>{record.date}</td>
                                <td className="border-b px-3 py-4" style={{ borderColor: "var(--color-border)" }}>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black text-white transition hk-primary-hover"
                                        style={{ backgroundColor: "var(--color-primary)" }}
                                    >
                                        <Printer size={14} />
                                        Print
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </article>
    );
}
