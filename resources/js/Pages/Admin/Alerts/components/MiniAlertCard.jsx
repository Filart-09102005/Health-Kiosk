import AlertSeverityBadge from "./AlertSeverityBadge";

export default function MiniAlertCard({ alert, onView }) {
    return (
        <button onClick={() => onView(alert)} className="w-full rounded-[12px] border p-3 text-left transition hk-admin-nav-hover" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-black">{alert.fullName}</p>
                    <p className="mt-1 text-xs font-bold" style={{ color: "var(--color-muted)" }}>{alert.alertType} - {alert.measurementValue}</p>
                </div>
                <AlertSeverityBadge severity={alert.severity} />
            </div>
        </button>
    );
}
