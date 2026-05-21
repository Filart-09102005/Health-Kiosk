import SeverityFilter from "./SeverityFilter";
import StatusFilter from "./StatusFilter";
import DateRangePicker from "./DateRangePicker";

export default function AlertsFilters() {
    return (
        <div className="flex flex-wrap gap-2">
            <SeverityFilter />
            <StatusFilter />
            <select className="h-11 rounded-[12px] border bg-transparent px-3 text-sm font-black outline-none" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                {["Measurement", "Temperature", "SpO2", "Heart Rate", "BMI"].map((item) => <option key={item}>{item}</option>)}
            </select>
            <DateRangePicker />
        </div>
    );
}
