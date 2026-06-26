const measurementLabels = {
    heart_rate: "Heart rate",
    spo2: "SpO2",
    temperature: "Temperature",
    height: "Height",
    weight: "Weight",
    bmi: "BMI",
};

export default function MeasurementBadges({ completed, total, missing = [] }) {
    const percent = Math.round((completed / total) * 100);
    const missingText = missing.length
        ? `Missing: ${missing.map((item) => measurementLabels[item] || item).join(", ")}`
        : "Complete";

    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs font-black">{completed}/{total} measurements</span>
            <div className="h-1.5 w-24 overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-surface)" }}>
                <span
                    className="block h-full rounded-full transition-all"
                    style={{
                        width: `${percent}%`,
                        backgroundColor: percent === 100 ? "var(--color-success)" : "var(--color-primary)",
                    }}
                />
            </div>
            <span className="max-w-[14rem] text-[0.65rem] font-bold leading-snug" style={{ color: "var(--color-muted)" }}>{missingText}</span>
        </div>
    );
}
