import { HeartPulse, Droplets, Thermometer, AlertTriangle } from "lucide-react";

export default function MeasurementBreakdownCard({ alert }) {
    const measurements = [
        { label: "Heart Rate", value: alert.heartRate, icon: HeartPulse },
        { label: "SpO2", value: alert.spo2, icon: Droplets },
        { label: "Temp", value: alert.temperature, icon: Thermometer },
        { label: "Triggered", value: alert.measurementValue, icon: AlertTriangle, flagged: true },
    ];

    return (
        <div className="rounded-[1.25rem] border p-4" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <p className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--color-muted)" }}>Measurement breakdown</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
                {measurements.map(({ label, value, icon: Icon, flagged }) => (
                    <div
                        key={label}
                        className="rounded-[1rem] border p-3"
                        style={{
                            backgroundColor: flagged ? "color-mix(in srgb, var(--color-error) 8%, var(--color-surface))" : "var(--color-surface)",
                            borderColor: flagged ? "color-mix(in srgb, var(--color-error) 30%, transparent)" : "transparent",
                        }}
                    >
                        <p
                            className="flex items-center gap-1.5 text-xs font-black uppercase"
                            style={{ color: flagged ? "var(--color-error)" : "var(--color-muted)" }}
                        >
                            <Icon size={12} />
                            {label}
                        </p>
                        <p className="mt-1 font-black" style={{ color: flagged ? "var(--color-error)" : "var(--color-text)" }}>{value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
