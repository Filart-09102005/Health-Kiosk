import { Activity, HeartPulse, Ruler, Scale, Thermometer } from "lucide-react";
import { cardClassName, cardStyle } from "../utils/surface";

const items = (record) => [
    { label: "Temperature", value: `${record.temperature}°C`, icon: Thermometer },
    { label: "Heart rate", value: `${record.heartRate} bpm`, icon: HeartPulse },
    { label: "SpO2", value: `${record.spo2}%`, icon: Activity },
    { label: "Height", value: `${record.height} cm`, icon: Ruler },
    { label: "Weight", value: `${record.weight} kg`, icon: Scale },
];

export default function MeasurementSummaryCard({ record }) {
    return (
        <article className={`${cardClassName} p-4`} style={cardStyle}>
            <p className="text-sm font-black">Measurement summary</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {items(record).map((item) => {
                    const Icon = item.icon;

                    return (
                        <div
                            key={item.label}
                            className="flex items-center gap-3 rounded-xl border p-3"
                            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                        >
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, transparent)", color: "var(--color-primary)" }}>
                                <Icon size={16} />
                            </span>
                            <div>
                                <p className="text-xs font-bold" style={{ color: "var(--color-muted)" }}>{item.label}</p>
                                <p className="text-sm font-black">{item.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </article>
    );
}
