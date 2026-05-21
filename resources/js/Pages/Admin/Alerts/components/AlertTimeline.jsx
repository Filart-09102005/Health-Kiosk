const timeline = [
    ["08:10 AM", "Health Check Started"],
    ["08:11 AM", "Temperature Recorded"],
    ["08:12 AM", "High Temperature Detected"],
    ["08:13 AM", "Alert Generated"],
    ["08:14 AM", "Admin Reviewed Alert"],
    ["08:16 AM", "Alert Resolution Pending"],
];

export default function AlertTimeline() {
    return (
        <div className="space-y-3">
            {timeline.map(([time, event], index) => (
                <div key={event} className="flex gap-3">
                    <div className="flex flex-col items-center">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: index >= 2 ? "var(--color-error)" : "var(--color-success)" }} />
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
