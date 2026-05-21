export default function MeasurementTypeFilter() {
    return (
        <select className="rounded-[12px] border px-4 py-3 text-sm font-black outline-none" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-text)" }}>
            <option>All measurements</option>
            <option>Heart Rate</option>
            <option>SpO2</option>
            <option>Temperature</option>
            <option>Height & Weight</option>
            <option>BMI</option>
        </select>
    );
}
