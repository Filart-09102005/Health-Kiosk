export default function MeasurementBreakdownCard({ alert }) {
    const measurements = [["Heart Rate", alert.heartRate], ["SpO2", alert.spo2], ["BMI", alert.bmi], ["Triggered", alert.measurementValue]];

    return (
        <div className="rounded-[14px] border p-4" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <p className="font-black">Measurement breakdown</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
                {measurements.map(([label, value]) => (
                    <div key={label} className="rounded-[12px] p-3" style={{ backgroundColor: "var(--color-surface)" }}>
                        <p className="text-xs font-black uppercase" style={{ color: "var(--color-muted)" }}>{label}</p>
                        <p className="mt-1 font-black">{value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
