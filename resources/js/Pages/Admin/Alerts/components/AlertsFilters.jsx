import FilterDropdown from "./FilterDropdown";

export default function AlertsFilters({ filters, onFilterChange, severityOptions, measurementOptions }) {
    return (
        <div className="flex flex-wrap items-end gap-3">
            <div className="w-32">
                <FilterDropdown
                    label="Severity"
                    value={filters.severity}
                    options={severityOptions}
                    onChange={(val) => onFilterChange("severity", val)}
                    active={filters.severity !== "all"}
                />
            </div>
            <div className="w-40">
                <FilterDropdown
                    label="Measurement"
                    value={filters.measurement}
                    options={measurementOptions}
                    onChange={(val) => onFilterChange("measurement", val)}
                    active={filters.measurement !== "all"}
                />
            </div>
        </div>
    );
}
