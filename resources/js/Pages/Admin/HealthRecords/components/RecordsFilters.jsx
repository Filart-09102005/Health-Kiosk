import { motion, useReducedMotion } from "framer-motion";
import { cardClassName, cardStyle } from "../utils/surface";
import DateRangePicker from "./DateRangePicker";
import FilterDropdown from "./FilterDropdown";
import QuickFilters from "./QuickFilters";
import TableToolbar from "./TableToolbar";

const healthStatusOptions = [
    { value: "all", label: "All statuses" },
    { value: "Normal", label: "Normal" },
    { value: "Watch", label: "Watch" },
    { value: "Alert", label: "Alert" },
];

const roleOptions = [
    { value: "all", label: "All roles" },
    { value: "Student", label: "Student" },
    { value: "Teacher", label: "Teacher" },
];

const sessionOptions = [
    { value: "all", label: "All sessions" },
    { value: "Completed", label: "Completed" },
    { value: "Incomplete", label: "Incomplete" },
    { value: "In Progress", label: "In Progress" },
];

const measurementOptions = [
    { value: "all", label: "All measurements" },
    { value: "complete", label: "Fully complete" },
    { value: "partial", label: "Partially complete" },
];

export default function RecordsFilters({
    filters,
    onFilterChange,
    quickFilter,
    onQuickFilterChange,
    search,
    onSearchChange,
    isSearching,
    onRefresh,
    activeFilterCount,
}) {
    const shouldReduceMotion = useReducedMotion();

    return (
        <motion.section
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldReduceMotion ? { duration: 0.01 } : { delay: 1.08, duration: 0.34, ease: "easeOut" }}
            className={`space-y-4 ${cardClassName} p-5`}
            style={cardStyle}
        >
            <div className="space-y-4">
                <TableToolbar
                    search={search}
                    onSearchChange={onSearchChange}
                    isSearching={isSearching}
                    onRefresh={onRefresh}
                    activeFilterCount={activeFilterCount}
                />
                <QuickFilters active={quickFilter} onChange={onQuickFilterChange} />
            </div>

            <div className="rounded-2xl border p-4" style={{ backgroundColor: "color-mix(in srgb, var(--color-surface) 72%, transparent)", borderColor: "var(--color-border)" }}>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                    <DateRangePicker
                        from={filters.dateFrom}
                        to={filters.dateTo}
                        onFromChange={(value) => onFilterChange("dateFrom", value)}
                        onToChange={(value) => onFilterChange("dateTo", value)}
                    />
                    <FilterDropdown
                        label="Health status"
                        value={filters.healthStatus}
                        options={healthStatusOptions}
                        onChange={(value) => onFilterChange("healthStatus", value)}
                        active={filters.healthStatus !== "all"}
                    />
                    <FilterDropdown
                        label="Role"
                        value={filters.role}
                        options={roleOptions}
                        onChange={(value) => onFilterChange("role", value)}
                        active={filters.role !== "all"}
                    />
                    <FilterDropdown
                        label="Session status"
                        value={filters.sessionStatus}
                        options={sessionOptions}
                        onChange={(value) => onFilterChange("sessionStatus", value)}
                        active={filters.sessionStatus !== "all"}
                    />
                    <FilterDropdown
                        label="Measurement"
                        value={filters.measurement}
                        options={measurementOptions}
                        onChange={(value) => onFilterChange("measurement", value)}
                        active={filters.measurement !== "all"}
                    />
                </div>
            </div>
        </motion.section>
    );
}
