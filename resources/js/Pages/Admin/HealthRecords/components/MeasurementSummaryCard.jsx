import { Activity, HeartPulse, Ruler, Scale, Thermometer, TriangleAlert } from "lucide-react";
import { cardClassName, cardStyle } from "../utils/surface";

const isAbnormal = (key, record) => {
    if (!record || !record.measurement_statuses) return false;
    const statusKey = key === "Temperature" ? "temperature" 
                    : key === "Heart rate" ? "heart_rate"
                    : key === "SpO2" ? "spo2" : null;
    if (!statusKey) return false;
    const status = record.measurement_statuses[statusKey];
    return status === 'Consult Clinic' || status === 'Watch';
};

const formatValue = (val, unit) => {
    if (val === null || val === undefined || val === "" || Number(val) === 0) {
        return "--";
    }
    return `${val} ${unit}`;
};

const items = (record) => [
    { key: "Temperature", label: "Temperature", value: formatValue(record.temperature, "°C"), icon: Thermometer, abnormal: isAbnormal("Temperature", record) },
    { key: "Heart rate", label: "Heart rate", value: formatValue(record.heartRate ?? record.heart_rate, "bpm"), icon: HeartPulse, abnormal: isAbnormal("Heart rate", record) },
    { key: "SpO2", label: "SpO2", value: formatValue(record.spo2, "%"), icon: Activity, abnormal: isAbnormal("SpO2", record) },
    { key: "Height", label: "Height", value: formatValue(record.height, "cm"), icon: Ruler, abnormal: false },
    { key: "Weight", label: "Weight", value: formatValue(record.weight, "kg"), icon: Scale, abnormal: false },
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
                            style={{ 
                                borderColor: item.abnormal ? "var(--color-error)" : "var(--color-border)", 
                                backgroundColor: item.abnormal ? "color-mix(in srgb, var(--color-error) 5%, transparent)" : "var(--color-surface)" 
                            }}
                        >
                            <span 
                                className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0" 
                                style={{ 
                                    backgroundColor: item.abnormal ? "color-mix(in srgb, var(--color-error) 10%, transparent)" : "color-mix(in srgb, var(--color-primary) 10%, transparent)", 
                                    color: item.abnormal ? "var(--color-error)" : "var(--color-primary)" 
                                }}
                            >
                                <Icon size={16} />
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold" style={{ color: item.abnormal ? "var(--color-error)" : "var(--color-muted)" }}>{item.label}</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-black truncate" style={{ color: item.abnormal ? "var(--color-error)" : "inherit" }}>
                                        {item.value}
                                    </p>
                                    {item.abnormal && <TriangleAlert size={14} style={{ color: "var(--color-error)" }} className="opacity-90 ml-2 flex-shrink-0" />}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </article>
    );
}
