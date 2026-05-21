import { recentAnalyticsTable } from "../data/demoData";
import AnalyticsSummaryCard from "./AnalyticsSummaryCard";
import StatusBadge from "./StatusBadge";

export default function RecentAnalyticsTable() {
    return (
        <AnalyticsSummaryCard title="Recent analytics events">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                    <thead>
                        <tr style={{ color: "var(--color-muted)" }}>
                            {["Event", "Module", "Time", "Impact"].map((h) => (
                                <th key={h} className="border-b px-3 py-2 text-xs font-black uppercase" style={{ borderColor: "var(--color-border)" }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {recentAnalyticsTable.map((row) => (
                            <tr key={row.id} className="transition hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,transparent)]">
                                <td className="border-b px-3 py-3 font-black" style={{ borderColor: "var(--color-border)" }}>{row.event}</td>
                                <td className="border-b px-3 py-3" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>{row.module}</td>
                                <td className="border-b px-3 py-3 text-xs font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>{row.time}</td>
                                <td className="border-b px-3 py-3" style={{ borderColor: "var(--color-border)" }}><StatusBadge label={row.impact} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AnalyticsSummaryCard>
    );
}
