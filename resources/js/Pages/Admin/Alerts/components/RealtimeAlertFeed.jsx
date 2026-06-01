import SectionHeader from "./SectionHeader";
import RealtimeAlertCard from "./RealtimeAlertCard";

export default function RealtimeAlertFeed({ alerts = [], alertsEnabled = true, sensitivityProfile }) {
    return (
        <section className="rounded-[14px] border p-5 shadow-xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <SectionHeader
                eyebrow={sensitivityProfile?.delayLabel || "Realtime"}
                title="Live alert feed"
                description={alertsEnabled ? sensitivityProfile?.delayDetail || "Incoming kiosk health warnings." : "Alerts are disabled in Settings."}
            />
            <div className="mt-4 space-y-3">
                {alerts.length ? alerts.slice(0, 4).map((alert) => <RealtimeAlertCard key={alert.id} alert={alert} />) : (
                    <div className="rounded-[12px] border p-4 text-sm font-bold" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-muted)" }}>
                        No alerts are currently entering the queue with this setting.
                    </div>
                )}
            </div>
        </section>
    );
}
