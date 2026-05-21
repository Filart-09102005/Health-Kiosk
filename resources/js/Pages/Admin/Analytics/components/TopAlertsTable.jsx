import { topAlertsTable } from "../data/demoData";
import AnalyticsSummaryCard from "./AnalyticsSummaryCard";
import StatusBadge from "./StatusBadge";

export default function TopAlertsTable() {
    return (
        <AnalyticsSummaryCard title="Top alerts table">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                    <thead>
                        <tr style={{ color: "var(--color-muted)" }}>
                            {["Alert type", "Count", "Severity", "Change"].map((h) => (
                                <th key={h} className="border-b px-3 py-2 text-xs font-black uppercase" style={{ borderColor: "var(--color-border)" }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {topAlertsTable.map((row) => (
                            <tr key={row.id} className="transition hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,transparent)]">
                                <td className="border-b px-3 py-3 font-black" style={{ borderColor: "var(--color-border)" }}>{row.type}</td>
                                <td className="border-b px-3 py-3 font-black" style={{ borderColor: "var(--color-border)" }}>{row.count}</td>
                                <td className="border-b px-3 py-3" style={{ borderColor: "var(--color-border)" }}><StatusBadge label={row.severity} tone={row.severity} /></td>
                                <td className="border-b px-3 py-3 text-xs font-black" style={{ borderColor: "var(--color-border)", color: row.change.startsWith("+") ? "var(--color-error)" : "var(--color-success)" }}>{row.change}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AnalyticsSummaryCard>
    );
}
