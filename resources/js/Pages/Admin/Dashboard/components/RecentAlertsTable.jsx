import { recentAlerts } from "../data/demoData";
import { cardClassName, cardStyle } from "../utils/surface";
import SectionHeader from "./SectionHeader";
import StatusBadge from "./StatusBadge";
import TableControls from "./TableControls";

export default function RecentAlertsTable({ records = recentAlerts }) {
    return (
        <article className={`${cardClassName} p-5`} style={cardStyle}>
            <SectionHeader title="Recent alerts" description="Clinical and device alerts requiring clinic attention." />
            <TableControls searchPlaceholder="Search alerts..." />
            <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                    <thead>
                        <tr style={{ color: "var(--color-muted)" }}>
                            {["Student / Source", "Alert Type", "Severity", "Time", "Status"].map((heading) => (
                                <th key={heading} className="border-b px-3 py-3 text-xs font-black uppercase tracking-wide" style={{ borderColor: "var(--color-border)" }}>
                                    {heading}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((row) => (
                            <tr key={row.id} className="transition hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,transparent)]">
                                <td className="border-b px-3 py-4 font-black" style={{ borderColor: "var(--color-border)" }}>{row.student}</td>
                                <td className="border-b px-3 py-4" style={{ borderColor: "var(--color-border)" }}>{row.type}</td>
                                <td className="border-b px-3 py-4" style={{ borderColor: "var(--color-border)" }}>
                                    <StatusBadge label={row.severity} />
                                </td>
                                <td className="border-b px-3 py-4 text-xs font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>{row.time}</td>
                                <td className="border-b px-3 py-4" style={{ borderColor: "var(--color-border)" }}>
                                    <StatusBadge label={row.status} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </article>
    );
}
