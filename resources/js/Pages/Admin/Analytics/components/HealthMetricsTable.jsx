import { healthMetricsTable } from "../data/demoData";
import AnalyticsSummaryCard from "./AnalyticsSummaryCard";
import StatusBadge from "./StatusBadge";

export default function HealthMetricsTable() {
    return (
        <AnalyticsSummaryCard title="Health metrics table">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                        <tr style={{ color: "var(--color-muted)" }}>
                            {["Metric", "Average", "Min", "Max", "Status", "Trend"].map((h) => (
                                <th key={h} className="border-b px-3 py-2 text-xs font-black uppercase" style={{ borderColor: "var(--color-border)" }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {healthMetricsTable.map((row) => (
                            <tr key={row.id} className="transition hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,transparent)]">
                                <td className="border-b px-3 py-3 font-black" style={{ borderColor: "var(--color-border)" }}>{row.metric}</td>
                                <td className="border-b px-3 py-3" style={{ borderColor: "var(--color-border)" }}>{row.average}</td>
                                <td className="border-b px-3 py-3 text-xs" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>{row.min}</td>
                                <td className="border-b px-3 py-3 text-xs" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>{row.max}</td>
                                <td className="border-b px-3 py-3" style={{ borderColor: "var(--color-border)" }}><StatusBadge label={row.status} /></td>
                                <td className="border-b px-3 py-3 text-xs font-black" style={{ borderColor: "var(--color-border)", color: "var(--color-success)" }}>{row.trend}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AnalyticsSummaryCard>
    );
}
