import AlertSeverityBadge from "./AlertSeverityBadge";
import AlertStatusBadge from "./AlertStatusBadge";

export default function AlertSummaryCard({ alert }) {
    return (
        <div className="rounded-[14px] border p-4" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="font-black">{alert.id}</p>
                    <p className="mt-1 text-sm font-bold" style={{ color: "var(--color-muted)" }}>{alert.alertType} - {alert.measurementValue}</p>
                </div>
                <AlertSeverityBadge severity={alert.severity} />
            </div>
            <div className="mt-3"><AlertStatusBadge status={alert.status} /></div>
        </div>
    );
}
