import { recentSessions } from "../data/demoData";
import { cardClassName, cardStyle } from "../utils/surface";
import StatusBadge from "./StatusBadge";

export default function SessionUsersTable({ records = recentSessions }) {
    return (
        <article className={`${cardClassName} p-5`} style={cardStyle}>
            <div className="mb-4">
                <h3 className="text-sm font-black">Session Users</h3>
                <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>
                    Users included in today's kiosk completion count.
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                    <thead>
                        <tr style={{ color: "var(--color-muted)" }}>
                            {["School ID", "User", "Started", "Status"].map((heading) => (
                                <th
                                    key={heading}
                                    className="border-b px-3 py-3 text-xs font-black uppercase tracking-wide"
                                    style={{ borderColor: "var(--color-border)" }}
                                >
                                    {heading}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((row) => (
                            <tr key={row.id} className="transition hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,transparent)]">
                                <td className="border-b px-3 py-4 font-black" style={{ borderColor: "var(--color-border)" }}>
                                    {row.schoolId}
                                </td>
                                <td className="border-b px-3 py-4" style={{ borderColor: "var(--color-border)" }}>
                                    {row.user}
                                </td>
                                <td className="border-b px-3 py-4 text-xs font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>
                                    {row.started}
                                </td>
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
