import SectionHeader from "./SectionHeader";
import MiniAlertCard from "./MiniAlertCard";

export default function CriticalAlertsPanel({ alerts = [], onView }) {
    const critical = alerts.filter((alert) => alert.severity === "Critical");

    return (
        <section className="rounded-[14px] border p-5" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <SectionHeader title="Critical escalation lane" description="Highest-risk readings that should stay visible." />
            <div className="mt-4 space-y-3">
                {critical.length ? critical.map((alert) => (
                    <MiniAlertCard key={alert.id} alert={alert} onView={() => onView?.(alert)} />
                )) : <p className="text-sm font-bold" style={{ color: "var(--color-muted)" }}>No critical alerts in the demo lane.</p>}
            </div>
        </section>
    );
}
