export default function AlertTimeline({ alert }) {
    if (!alert) return null;

    const timeline = [];
    timeline.push([alert.triggeredAt, "Health Check Started"]);
    timeline.push([alert.triggeredAt, `${alert.measurementType || "Measurement"} Recorded`]);
    
    if (alert.severity) {
        timeline.push([alert.triggeredAt, `${alert.severity} Severity Detected`]);
    }
    
    timeline.push([alert.triggeredAt, "Alert Generated"]);
    
    if (alert.status === "Resolved") {
        timeline.push([alert.triggeredAt, "Admin Reviewed Alert"]);
        timeline.push([alert.triggeredAt, "Alert Resolved"]);
    } else {
        timeline.push(["Pending", "Alert Resolution Pending"]);
    }

    return (
        <div className="space-y-3">
            {timeline.map(([time, event], index) => (
                <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: index >= timeline.length - 2 ? "var(--color-error)" : "var(--color-success)" }} />
                        {index < timeline.length - 1 ? <span className="mt-1 h-8 w-px" style={{ backgroundColor: "var(--color-border)" }} /> : null}
                    </div>
                    <div>
                        <p className="text-xs font-black" style={{ color: "var(--color-muted)" }}>{time}</p>
                        <p className="text-sm font-bold">{event}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
