import DateRangePicker from "./DateRangePicker";
import CustomSelectField from "../../../../Global/CustomSelectField";

export default function ReportsFilters({ range, filters, options, onRangeChange, onFilterChange, onSetArrayFilter }) {
    const isCollege = filters.department === "COLLEGE";
    const isBasicEducation = filters.department && filters.department !== "COLLEGE" && filters.department !== "FACULTY";

    const departmentOptions = [
        { value: "", label: "All Departments" },
        ...(options.departments || []).map((item) => ({ value: item, label: item })),
    ];

    const genderOptions = [
        { value: "", label: "All Genders" },
        ...(options.genders || []).map((item) => ({ value: item, label: formatGender(item) })),
    ];

    const programOptions = [
        { value: "", label: "All Courses" },
        ...(options.programs || []).map((item) => ({ value: item, label: item })),
    ];

    const yearLevelOptions = [
        { value: "", label: "All Year Levels" },
        ...(options.year_levels || []).map((item) => ({ value: item, label: item })),
    ];

    const gradeLevelOptions = [
        { value: "", label: "All Grade Levels" },
        ...(options.grade_levels || []).map((item) => ({ value: item, label: item })),
    ];

    const strandOptions = [
        { value: "", label: "All Senior High Strands" },
        ...(options.strands || []).map((item) => ({ value: item, label: item })),
    ];

    return (
        <div className="min-w-0 flex-1 space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <DateRangePicker range={range} onRangeChange={onRangeChange} />
            </div>

            <div
                className="grid gap-4 rounded-2xl border p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 shadow-sm"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
            >
                <CustomSelectField
                    label="Department"
                    value={filters.department}
                    onChange={(value) => onFilterChange("department", value)}
                    options={departmentOptions}
                />
                <CustomSelectField
                    label="Gender"
                    value={filters.gender}
                    onChange={(value) => onFilterChange("gender", value)}
                    options={genderOptions}
                />

                {isCollege ? (
                    <>
                        <CustomSelectField
                            label="Program / Course"
                            value={filters.program[0] || ""}
                            onChange={(value) => onSetArrayFilter("program", value)}
                            options={programOptions}
                        />
                        <CustomSelectField
                            label="Year Level"
                            value={filters.year_level[0] || ""}
                            onChange={(value) => onSetArrayFilter("year_level", value)}
                            options={yearLevelOptions}
                        />
                    </>
                ) : null}

                {isBasicEducation ? (
                    <>
                        <CustomSelectField
                            label="Grade Level"
                            value={filters.grade_level[0] || ""}
                            onChange={(value) => onSetArrayFilter("grade_level", value)}
                            options={gradeLevelOptions}
                        />
                        <CustomSelectField
                            label="Senior High Program"
                            value={filters.strand[0] || ""}
                            onChange={(value) => onSetArrayFilter("strand", value)}
                            options={strandOptions}
                        />
                    </>
                ) : null}
            </div>
        </div>
    );
}

function formatGender(value) {
    return String(value || "")
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
