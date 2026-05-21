import DateRangePicker from "./DateRangePicker";
import HealthStatusFilter from "./HealthStatusFilter";
import MeasurementTypeFilter from "./MeasurementTypeFilter";
import RoleFilter from "./RoleFilter";

export default function ReportsFilters() {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <DateRangePicker />
            <RoleFilter />
            <HealthStatusFilter />
            <MeasurementTypeFilter />
            <select className="rounded-[12px] border px-4 py-3 text-sm font-black outline-none" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                <option>PDF</option>
                <option>Excel</option>
                <option>Print</option>
            </select>
        </div>
    );
}
