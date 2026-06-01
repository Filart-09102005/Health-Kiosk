import StatusIndicator from "./StatusIndicator";
import AlertSeverityBadge from "./AlertSeverityBadge";

export default function RealtimeAlertCard({ alert }) {
    return (
        <article className="rounded-[12px] border p-3" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                    <div className="mt-1"><StatusIndicator tone={alert.severity === "Critical" ? "var(--color-error)" : "var(--color-primary)"} pulse /></div>
                    <div>
                        <p className="text-sm font-black">{alert.alertType} detected</p>
                        <p className="mt-1 text-xs font-bold" style={{ color: "var(--color-muted)" }}>{alert.fullName} - {alert.measurementValue}</p>
                        {alert.queueDelay ? (
                            <p className="mt-1 text-[0.68rem] font-black uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
                                {alert.queueMode} - {alert.detectionRate} - {alert.queueDelay}
                            </p>
                        ) : null}
                    </div>
                </div>
                <AlertSeverityBadge severity={alert.severity} />
            </div>
        </article>
    );
}
