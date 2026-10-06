import { Activity, AlertTriangle, BellRing, CheckCircle2, ClipboardCheck, Clock, PlayCircle } from "lucide-react";

export default function AlertTimeline({ alert }) {
    if (!alert) return null;

    const timeline = [];
    timeline.push({ time: alert.triggeredAt, event: "Health Check Started", icon: PlayCircle, tone: "done" });
    timeline.push({ time: alert.triggeredAt, event: `${alert.measurementType || "Measurement"} Recorded`, icon: Activity, tone: "done" });

    if (alert.severity) {
        timeline.push({ time: alert.triggeredAt, event: `${alert.severity} Severity Detected`, icon: AlertTriangle, tone: "warn" });
    }

    timeline.push({ time: alert.triggeredAt, event: "Alert Generated", icon: BellRing, tone: "warn" });

    if (alert.status === "Resolved") {
        timeline.push({ time: alert.triggeredAt, event: "Admin Reviewed Alert", icon: ClipboardCheck, tone: "done" });
        timeline.push({ time: alert.triggeredAt, event: "Alert Resolved", icon: CheckCircle2, tone: "success" });
    } else {
        timeline.push({ time: "Pending", event: "Alert Resolution Pending", icon: Clock, tone: "pending" });
    }

    const toneColor = {
        done: "var(--color-primary)",
        warn: "var(--alert-high)",
        success: "var(--color-success)",
        pending: "var(--color-muted)",
    };

    return (
        <div className="space-y-0">
            {timeline.map(({ time, event, icon: Icon, tone }, index) => {
                const color = toneColor[tone];
                const isLast = index === timeline.length - 1;

                return (
                    <div key={index} className="flex gap-3">
                        <div className="flex flex-col items-center">
                            <span
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                                style={{ backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)` }}
                            >
                                <Icon size={14} style={{ color }} />
                            </span>
                            {!isLast && <span className="my-0.5 w-px flex-1" style={{ backgroundColor: "var(--color-border)", minHeight: "1.25rem" }} />}
                        </div>
                        <div className={isLast ? "pb-0" : "pb-4"}>
                            <p className="text-xs font-black" style={{ color: "var(--color-muted)" }}>{time}</p>
                            <p className="text-sm font-bold" style={{ color: "var(--color-text)" }}>{event}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
