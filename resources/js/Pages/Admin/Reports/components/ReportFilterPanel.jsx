import { Calendar, ChevronDown, GraduationCap, Users } from "lucide-react";

// ─── Shared style helpers ──────────────────────────────────────────────────────

const labelCls = "mb-1.5 block text-[0.65rem] font-black uppercase tracking-[0.12em]";

const selectCls =
    "h-10 w-full rounded-[8px] border px-3 text-sm font-bold outline-none appearance-none cursor-pointer";

const selectStyle = {
    backgroundColor: "var(--color-card)",
    borderColor: "var(--color-border)",
    color: "var(--color-text)",
};

const fieldCls = "h-10 w-full rounded-[8px] border px-3 text-sm font-bold outline-none";

// ─── Chip multi-select ────────────────────────────────────────────────────────

function ChipGroup({ options, selected, onChange, colorVar = "--color-primary" }) {
    const toggle = (val) => {
        const next = selected.includes(val)
            ? selected.filter((v) => v !== val)
            : [...selected, val];
        onChange(next);
    };

    const allSelected = selected.length === 0;

    return (
        <div className="flex flex-wrap gap-1.5">
            {/* "All" chip */}
            <button
                type="button"
                onClick={() => onChange([])}
                className="rounded-full border px-3 py-1 text-xs font-black transition"
                style={
                    allSelected
                        ? { backgroundColor: `var(${colorVar})`, borderColor: `var(${colorVar})`, color: "#fff" }
                        : { backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-muted)" }
                }
            >
                All
            </button>

            {options.map((opt) => {
                const active = selected.includes(opt);
                return (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => toggle(opt)}
                        className="rounded-full border px-3 py-1 text-xs font-black transition"
                        style={
                            active
                                ? { backgroundColor: `var(${colorVar})`, borderColor: `var(${colorVar})`, color: "#fff" }
                                : { backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-muted)" }
                        }
                    >
                        {opt}
                    </button>
                );
            })}
        </div>
    );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function FilterSection({ icon: Icon, title, children }) {
    return (
        <div className="rounded-[10px] border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
            <div className="mb-3 flex items-center gap-2">
                <Icon size={14} style={{ color: "var(--color-primary)" }} />
                <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--color-muted)" }}>
                    {title}
                </span>
            </div>
            {children}
        </div>
    );
}

// ─── Main filter panel ────────────────────────────────────────────────────────

export default function ReportFilterPanel({ filters, onFilterChange, options }) {
    const { departments = [], programs = [], strands = [], year_levels = [], grade_levels = [] } = options;

    const dept = String(filters.department ?? "").toUpperCase();
    const isCollegeStudent = dept === "COLLEGE";
    const isBedStudent = dept === "BED";
    
    // showYearLevel and showProgram only for College Students
    const showYearLevel = isCollegeStudent;
    const showProgram   = isCollegeStudent;

    // showGradeLevel for BED Students
    const showGradeLevel = isBedStudent;
    
    // showStrand for BED Students in Grade 11 or 12
    const isSeniorHigh = ["11", "12"].some((kw) => String(filters.grade_level ?? "").includes(kw));
    const showStrand = isBedStudent && (!filters.grade_level || isSeniorHigh);

    const handleDeptChange = (dept) => {
        // Reset academic filters when department changes
        onFilterChange({
            department: dept,
            program: [],
            strand: [],
            year_level: [],
            grade_level: [],
        });
    };

    return (
        <div className="space-y-3">
            {/* ── Date Range ── */}
            <FilterSection icon={Calendar} title="Date Range">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                        <label className={labelCls} style={{ color: "var(--color-muted)" }}>From</label>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => onFilterChange({ dateFrom: e.target.value })}
                                className={fieldCls}
                                style={selectStyle}
                            />
                            <input
                                type="time"
                                value={filters.timeFrom}
                                onChange={(e) => onFilterChange({ timeFrom: e.target.value })}
                                className={fieldCls}
                                style={selectStyle}
                            />
                        </div>
                    </div>
                    <div>
                        <label className={labelCls} style={{ color: "var(--color-muted)" }}>To</label>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => onFilterChange({ dateTo: e.target.value })}
                                className={fieldCls}
                                style={selectStyle}
                            />
                            <input
                                type="time"
                                value={filters.timeTo}
                                onChange={(e) => onFilterChange({ timeTo: e.target.value })}
                                className={fieldCls}
                                style={selectStyle}
                            />
                        </div>
                    </div>
                </div>
            </FilterSection>

            {/* ── Population Filters ── */}
            <FilterSection icon={Users} title="Population Filter">
                <div className="grid gap-4 sm:grid-cols-2">
                    {/* Role */}
                    <div>
                        <label className={labelCls} style={{ color: "var(--color-muted)" }}>Role</label>
                        <ChipGroup
                            options={["student", "teacher"]}
                            selected={filters.role ? [filters.role] : []}
                            onChange={(vals) => onFilterChange({ role: vals[vals.length - 1] ?? null })}
                            colorVar="--color-primary"
                        />
                    </div>

                    {/* Department */}
                    <div>
                        <label className={labelCls} style={{ color: "var(--color-muted)" }}>Department</label>
                        <div className="relative">
                            <select
                                value={filters.department ?? ""}
                                onChange={(e) => handleDeptChange(e.target.value || null)}
                                className={selectCls}
                                style={selectStyle}
                            >
                                <option value="">All Departments</option>
                                {departments.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                            <ChevronDown
                                size={14}
                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                                style={{ color: "var(--color-muted)" }}
                            />
                        </div>
                    </div>
                </div>
            </FilterSection>

            {/* ── Academic Filter (College: Program + Year) ── */}
            {(showProgram || showYearLevel) && (
                <FilterSection icon={GraduationCap} title="Academic Filter">
                    <div className="space-y-4">
                        {showProgram && programs.length > 0 && (
                            <div>
                                <label className={labelCls} style={{ color: "var(--color-muted)" }}>Program</label>
                                <ChipGroup
                                    options={programs}
                                    selected={filters.program}
                                    onChange={(vals) => onFilterChange({ program: vals })}
                                    colorVar="--color-primary"
                                />
                            </div>
                        )}
                        {showYearLevel && year_levels.length > 0 && (
                            <div>
                                <label className={labelCls} style={{ color: "var(--color-muted)" }}>Year Level</label>
                                <ChipGroup
                                    options={year_levels}
                                    selected={filters.year_level}
                                    onChange={(vals) => onFilterChange({ year_level: vals })}
                                    colorVar="--color-primary"
                                />
                            </div>
                        )}
                    </div>
                </FilterSection>
            )}

            {/* ── Academic Filter (SHS: Strand + Grade) ── */}
            {(showStrand || showGradeLevel) && (
                <FilterSection icon={GraduationCap} title="Academic Filter">
                    <div className="space-y-4">
                        {showStrand && strands.length > 0 && (
                            <div>
                                <label className={labelCls} style={{ color: "var(--color-muted)" }}>Strand</label>
                                <ChipGroup
                                    options={strands}
                                    selected={filters.strand}
                                    onChange={(vals) => onFilterChange({ strand: vals })}
                                    colorVar="--color-primary"
                                />
                            </div>
                        )}
                        {showGradeLevel && grade_levels.length > 0 && (
                            <div>
                                <label className={labelCls} style={{ color: "var(--color-muted)" }}>Grade Level</label>
                                <ChipGroup
                                    options={grade_levels}
                                    selected={filters.grade_level}
                                    onChange={(vals) => onFilterChange({ grade_level: vals })}
                                    colorVar="--color-primary"
                                />
                            </div>
                        )}
                    </div>
                </FilterSection>
            )}
        </div>
    );
}
