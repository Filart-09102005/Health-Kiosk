import SectionHeader from "./SectionHeader";
import MiniAlertCard from "./MiniAlertCard";

export default function RecentCriticalAlerts({ alerts = [], onView }) {
    return (
        <section className="rounded-[14px] border p-5 shadow-xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <SectionHeader eyebrow="Priority queue" title="Critical alerts" description="Highest risk readings awaiting review or escalation." />
            <div className="mt-4 space-y-3">
                {alerts.map((alert) => <MiniAlertCard key={alert.id} alert={alert} onView={onView} />)}
            </div>
        </section>
    );
}
