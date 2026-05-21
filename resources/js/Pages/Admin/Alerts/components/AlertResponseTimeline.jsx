const events = [
    ["08:13 AM", "Alert generated"],
    ["08:14 AM", "Clinic queue notified"],
    ["08:16 AM", "Admin review pending"],
    ["08:20 AM", "Recommended recheck"],
];

export default function AlertResponseTimeline() {
    return (
        <div className="space-y-3">
            {events.map(([time, label]) => (
                <div key={label} className="flex gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} />
                    <div>
                        <p className="text-xs font-black" style={{ color: "var(--color-muted)" }}>{time}</p>
                        <p className="font-black">{label}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
