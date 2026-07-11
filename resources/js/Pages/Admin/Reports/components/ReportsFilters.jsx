import DateRangePicker from "./DateRangePicker";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const fieldClass = "h-11 w-full rounded-[12px] border px-3 text-sm font-black outline-none";
const fieldStyle = {
    backgroundColor: "var(--color-card)",
    borderColor: "var(--color-border)",
    color: "var(--color-text)",
};

export default function ReportsFilters({ range, filters, options, onRangeChange, onFilterChange, onSetArrayFilter }) {
    const isCollege = filters.department === "COLLEGE";
    const isBasicEducation = filters.department && filters.department !== "COLLEGE" && filters.department !== "FACULTY";

    return (
        <div className="min-w-0 flex-1 space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <DateRangePicker range={range} onRangeChange={onRangeChange} />

            </div>

            <div className="grid gap-4 rounded-[16px] border p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 shadow-sm" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                <SelectField
                    label="Department"
                    value={filters.department}
                    onChange={(value) => onFilterChange("department", value)}
                    options={[["", "All"], ...(options.departments || []).map((item) => [item, item])]}
                />
                <SelectField
                    label="Gender"
                    value={filters.gender}
                    onChange={(value) => onFilterChange("gender", value)}
                    options={[["", "All"], ...(options.genders || []).map((item) => [item, formatGender(item)])]}
                />

                {isCollege ? (
                    <>
                        <ArraySelectField
                            label="Program / Course"
                            value={filters.program}
                            onChange={(value) => onSetArrayFilter("program", value)}
                            options={options.programs || []}
                        />
                        <ArraySelectField
                            label="Year Level"
                            value={filters.year_level}
                            onChange={(value) => onSetArrayFilter("year_level", value)}
                            options={options.year_levels || []}
                        />
                    </>
                ) : null}

                {isBasicEducation ? (
                    <>
                        <ArraySelectField
                            label="Grade Level"
                            value={filters.grade_level}
                            onChange={(value) => onSetArrayFilter("grade_level", value)}
                            options={options.grade_levels || []}
                        />
                        <ArraySelectField
                            label="Senior High Program"
                            value={filters.strand}
                            onChange={(value) => onSetArrayFilter("strand", value)}
                            options={options.strands || []}
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

function SelectField({ label, value, onChange, options }) {
    const selected = options.find(([optionValue]) => optionValue === value);

    return (
        <CustomDropdown
            label={label}
            value={value}
            displayValue={selected?.[1] || "All"}
            options={options.map(([optionValue, optionLabel]) => ({ value: optionValue, label: optionLabel }))}
            onChange={onChange}
        />
    );
}

function ArraySelectField({ label, value = [], options = [], onChange }) {
    const selectedValue = value[0] || "";

    return (
        <div>
            <CustomDropdown
                label={label}
                value={selectedValue}
                displayValue={selectedValue || "All"}
                options={[{ value: "", label: "All" }, ...options.map((option) => ({ value: option, label: option }))]}
                onChange={onChange}
            />
            {!options.length ? (
                <span className="mt-1 block text-xs font-bold" style={{ color: "var(--color-muted)" }}>
                    No database values yet
                </span>
            ) : null}
        </div>
    );
}

function CustomDropdown({ label, value, displayValue, options, onChange }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;

        const handlePointerDown = (event) => {
            if (!rootRef.current?.contains(event.target)) {
                setOpen(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setOpen(false);
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    const handleSelect = (nextValue) => {
        onChange(nextValue);
        setOpen(false);
    };

    return (
        <div ref={rootRef} className="relative">
            <span className="text-[0.68rem] font-black uppercase tracking-[0.16em]" style={{ color: "var(--color-muted)" }}>
                {label}
            </span>
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                className={`${fieldClass} mt-2 flex items-center justify-between gap-3 pr-4 text-left transition`}
                style={fieldStyle}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className="min-w-0 truncate">{displayValue}</span>
                <ChevronDown
                    size={17}
                    className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                    style={{ color: "var(--color-muted)" }}
                />
            </button>

            {open ? (
                <div
                    className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-[14px] border p-1 shadow-xl"
                    style={{
                        backgroundColor: "var(--color-card)",
                        borderColor: "var(--color-border)",
                        boxShadow: "0 18px 50px rgba(0, 0, 0, 0.18)",
                    }}
                    role="listbox"
                >
                    <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto pr-1">
                        {options.map((option) => {
                            const active = option.value === value;

                            return (
                                <button
                                    key={option.value || "all"}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className="flex min-h-10 w-full items-center justify-between gap-3 rounded-[10px] px-3 py-2 text-left text-sm font-black transition hk-admin-nav-hover"
                                    style={{
                                        backgroundColor: active ? "color-mix(in srgb, var(--color-primary) 12%, transparent)" : "transparent",
                                        color: active ? "var(--color-primary)" : "var(--color-text)",
                                    }}
                                    role="option"
                                    aria-selected={active}
                                >
                                    <span className="min-w-0 truncate">{option.label}</span>
                                    {active ? <Check size={15} className="shrink-0" /> : <span className="h-[15px] w-[15px] shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
