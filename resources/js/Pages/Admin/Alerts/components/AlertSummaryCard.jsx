import { AlertTriangle, Thermometer, HeartPulse, Droplets, Activity } from "lucide-react";
import AlertSeverityBadge from "./AlertSeverityBadge";
import AlertStatusBadge from "./AlertStatusBadge";

const SEVERITY_ACCENT = {
    Critical: "var(--alert-critical)",
    High: "var(--alert-high)",
    Medium: "var(--alert-moderate)",
    Low: "var(--alert-low)",
};

function typeIcon(alertType) {
    const t = String(alertType || "").toLowerCase();
    if (t.includes("temp")) return Thermometer;
    if (t.includes("heart") || t.includes("bpm")) return HeartPulse;
    if (t.includes("spo2") || t.includes("oxygen")) return Droplets;
    if (t.includes("bmi")) return Activity;
    return AlertTriangle;
}

export default function AlertSummaryCard({ alert }) {
    const accent = SEVERITY_ACCENT[alert.severity] || "var(--color-muted)";
    const Icon = typeIcon(alert.alertType);

    return (
        <div
            className="flex items-start gap-3 overflow-hidden rounded-[1.25rem] border p-4"
            style={{
                backgroundColor: `color-mix(in srgb, ${accent} 6%, var(--color-card))`,
                borderColor: `color-mix(in srgb, ${accent} 30%, var(--color-border))`,
                borderLeftWidth: "4px",
                borderLeftColor: accent,
            }}
        >
            <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.875rem]"
                style={{ backgroundColor: `color-mix(in srgb, ${accent} 16%, transparent)` }}
            >
                <Icon size={20} style={{ color: accent }} />
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black" style={{ color: "var(--color-text)" }}>{alert.id}</p>
                    <AlertSeverityBadge severity={alert.severity} />
                    <AlertStatusBadge status={alert.status} />
                </div>
                <p className="mt-1 text-sm font-bold" style={{ color: "var(--color-muted)" }}>
                    {alert.alertType} <span style={{ color: accent, fontWeight: 900 }}>· {alert.measurementValue}</span>
                </p>
            </div>
        </div>
    );
}
