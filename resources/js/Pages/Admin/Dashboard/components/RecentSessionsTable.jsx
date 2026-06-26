import { cardClassName, cardStyle } from "../utils/surface";
import SectionHeader from "./SectionHeader";
import StatusBadge from "./StatusBadge";
import TableControls from "./TableControls";

export default function RecentSessionsTable({ records = [] }) {
    return (
        <article className={`${cardClassName} p-5`} style={cardStyle}>
            <SectionHeader title="Recent sessions" description="Kiosk session throughput and completion status." />
            <TableControls searchPlaceholder="Search sessions..." />
            <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                    <thead>
                        <tr style={{ color: "var(--color-muted)" }}>
                            {["School ID", "User", "Duration", "Started", "Status"].map((heading) => (
                                <th key={heading} className="border-b px-3 py-3 text-xs font-black uppercase tracking-wide" style={{ borderColor: "var(--color-border)" }}>
                                    {heading}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((row) => (
                            <tr key={row.id} className="transition hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,transparent)]">
                                <td className="border-b px-3 py-4 font-black" style={{ borderColor: "var(--color-border)" }}>{row.schoolId}</td>
                                <td className="border-b px-3 py-4" style={{ borderColor: "var(--color-border)" }}>{row.user}</td>
                                <td className="border-b px-3 py-4" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>{row.duration}</td>
                                <td className="border-b px-3 py-4 text-xs font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>{row.started}</td>
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
