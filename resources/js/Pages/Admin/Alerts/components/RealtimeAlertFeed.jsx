import SectionHeader from "./SectionHeader";
import RealtimeAlertCard from "./RealtimeAlertCard";

export default function RealtimeAlertFeed({ alerts = [] }) {
    return (
        <section className="rounded-[14px] border p-5 shadow-xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <SectionHeader eyebrow="Realtime" title="Live alert feed" description="Demo stream of incoming kiosk health warnings." />
            <div className="mt-4 space-y-3">
                {alerts.slice(0, 4).map((alert) => <RealtimeAlertCard key={alert.id} alert={alert} />)}
            </div>
        </section>
    );
}
