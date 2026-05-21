const events = [
    ["09:12 AM", "Report generation requested"],
    ["09:13 AM", "Records filtered and summarized"],
    ["09:14 AM", "PDF preview prepared"],
    ["09:15 AM", "Report marked ready"],
];

export default function ReportActivityTimeline() {
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
