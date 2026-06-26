import { cardClassName, cardStyle } from "../utils/surface";
import SectionHeader from "./SectionHeader";
import TableControls from "./TableControls";

export default function RecentActivityLogsTable({ records = [] }) {
    return (
        <article className={`${cardClassName} p-5`} style={cardStyle}>
            <SectionHeader title="Recent activity logs" description="Administrative and system actions across the clinic platform." />
            <TableControls searchPlaceholder="Search activity logs..." />
            <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                    <thead>
                        <tr style={{ color: "var(--color-muted)" }}>
                            {["Action", "Actor", "Module", "Time"].map((heading) => (
                                <th key={heading} className="border-b px-3 py-3 text-xs font-black uppercase tracking-wide" style={{ borderColor: "var(--color-border)" }}>
                                    {heading}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((row) => (
                            <tr key={row.id} className="transition hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,transparent)]">
                                <td className="border-b px-3 py-4 font-black" style={{ borderColor: "var(--color-border)" }}>{row.action}</td>
                                <td className="border-b px-3 py-4" style={{ borderColor: "var(--color-border)" }}>{row.actor}</td>
                                <td className="border-b px-3 py-4" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>{row.module}</td>
                                <td className="border-b px-3 py-4 text-xs font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>{row.time}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </article>
    );
}
