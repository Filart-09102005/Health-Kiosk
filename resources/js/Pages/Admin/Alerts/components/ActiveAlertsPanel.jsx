import SectionHeader from "./SectionHeader";
import MiniAlertCard from "./MiniAlertCard";

export default function ActiveAlertsPanel({ alerts = [], onView }) {
    return (
        <section className="rounded-[14px] border p-5" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <SectionHeader title="Active health warnings" description="Open kiosk alerts that still need clinic attention." />
            <div className="mt-4 space-y-3">
                {alerts.filter((alert) => alert.status !== "Resolved").slice(0, 3).map((alert) => (
                    <MiniAlertCard key={alert.id} alert={alert} onView={() => onView?.(alert)} />
                ))}
            </div>
        </section>
    );
}
