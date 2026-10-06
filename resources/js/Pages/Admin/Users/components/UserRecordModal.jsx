import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import useModalLayer from "../../../../Global/useModalLayer";
import UserAvatar from "./UserAvatar";
import CustomSelectField from "../../../../Global/CustomSelectField";
import { departmentLabel, departmentsFor, isStaffRole } from "../../../../Global/departments";
import Barcode from "react-barcode";
import BirthdayPicker from "../../../../Global/BirthdayPicker";

const gradeLevels = [
    { value: "Grade 7", label: "Grade 7" },
    { value: "Grade 8", label: "Grade 8" },
    { value: "Grade 9", label: "Grade 9" },
    { value: "Grade 10", label: "Grade 10" },
    { value: "Grade 11", label: "Grade 11" },
    { value: "Grade 12", label: "Grade 12" },
];

const strands = [
    { value: "ABM", label: "ABM" },
    { value: "HUMSS", label: "HUMSS" },
    { value: "STEM", label: "STEM" },
];

const yearLevels = [
    { value: "1st Year", label: "1st Year" },
    { value: "2nd Year", label: "2nd Year" },
    { value: "3rd Year", label: "3rd Year" },
    { value: "4th Year", label: "4th Year" },
];

const programs = [
    { value: "BSIT", label: "BSIT" },
    { value: "BSED", label: "BSED" },
    { value: "BEED", label: "BEED" },
    { value: "BSHM", label: "BSHM" },
    { value: "BSBA", label: "BSBA" },
];

const genders = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
];

const departmentOptions = (role) =>
    departmentsFor(role).map((code) => ({ value: code, label: departmentLabel(code) }));

// Which extra fields apply depends on where the person studies.
function extraFieldsFor(form) {
    if (isStaffRole(form?.role)) return [];
    
    const fields = [];
    if (form.department === "COLLEGE") {
        fields.push("year_level", "program");
    } else if (form.department === "BED") {
        fields.push("grade_level");
        const seniorHighGrades = ["Grade 11", "Grade 12"];
        if (seniorHighGrades.includes(form.grade_level)) {
            fields.push("strand");
        }
    }
    return fields;
}

// Grouped rather than one flat run of inputs: the same fields, but sorted into
// the three questions someone actually asks of a record — who they are, where
// they study, and how they sign in.
function sectionsFor(form) {
    return [
        { title: "Personal", fields: ["firstname", "lastname", "birthday", "age", "gender"] },
        { title: "Academic", fields: ["department", ...extraFieldsFor(form)] },
        { title: "Account", fields: ["student_id", "email", "barcode"] },
    ].filter((section) => section.fields.length);
}

const FIELD_LABELS = {
    student_id: "ID number (follows the barcode)",
    email: "Email address",
    grade_level: "Grade level",
    year_level: "Year level",
};

const prettyDate = (value) => {
    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? ""
        : date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

/**
 * View / edit one account.
 *
 * Themed with the app's CSS variables rather than the hardcoded near-black
 * palette this used to carry — that modal stayed dark even in light mode,
 * which was the single most jarring thing on these screens.
 */
export default function UserRecordModal({ mode, form, title, eyebrow, onChange, onClose, onSave, saving }) {
    useModalLayer(Boolean(mode));

    const editable = mode === "edit";
    const sections = sectionsFor(form);

    const updateField = (field, value) => {
        const next = { ...form, [field]: value };

        if (field === "birthday" && value) {
            const birth = new Date(value);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const months = today.getMonth() - birth.getMonth();
            if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) age -= 1;
            next.age = Number.isNaN(age) ? "" : age;
        }
        
        // Auto-clear irrelevant fields when the department changes
        if (field === "department") {
            if (isStaffRole(next.role)) {
                next.year_level = null;
                next.program = null;
                next.grade_level = null;
                next.strand = null;
            } else if (next.department === "COLLEGE") {
                next.grade_level = null;
                next.strand = null;
            } else if (next.department === "BED") {
                next.year_level = null;
                next.program = null;
            }
        }

        if (field === "grade_level") {
            const seniorHighGrades = ["Grade 11", "Grade 12"];
            if (!seniorHighGrades.includes(value)) {
                next.strand = null;
            }
        }

        // The server stores the barcode as the ID number too, so the barcode is
        // the one that is edited and the ID number follows it. Typing into the
        // ID number used to reissue the barcode without saying so.
        if (field === "barcode") {
            next.student_id = value;
        }

        onChange(next);
    };

    const modal = (
        <AnimatePresence>
            {mode && form ? (
                <motion.div
                    className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/55 p-4 backdrop-blur-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                >
                    <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default" />

                    <motion.section
                        role="dialog"
                        aria-modal="true"
                        initial={{ opacity: 0, scale: 0.97, y: 14 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: 14 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="relative z-[9010] flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[1.75rem] border shadow-2xl"
                        style={{
                            backgroundColor: "var(--color-card)",
                            borderColor: "var(--color-border)",
                            color: "var(--color-text)",
                        }}
                    >
                        <header
                            className="flex items-start justify-between gap-5 border-b px-6 py-5"
                            style={{ borderColor: "var(--color-border)" }}
                        >
                            <div className="flex min-w-0 items-center gap-4">
                                <UserAvatar firstname={form.firstname} lastname={form.lastname} size={48} />
                                <div className="min-w-0">
                                    <p
                                        className="text-[0.65rem] font-black uppercase tracking-[0.2em]"
                                        style={{ color: "var(--color-primary)" }}
                                    >
                                        {eyebrow}
                                    </p>
                                    <h3 className="mt-1 truncate text-xl font-black">
                                        {`${form.firstname || ""} ${form.lastname || ""}`.trim() || title}
                                    </h3>
                                    <p className="mt-0.5 truncate text-xs font-semibold" style={{ color: "var(--color-muted)" }}>
                                        {form.email || "No email on record"}
                                    </p>

                                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                        {form.role ? <HeaderChip value={form.role} tone="primary" /> : null}
                                        {form.department ? <HeaderChip value={form.department} /> : null}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                aria-label="Close record"
                                onClick={onClose}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition hk-soft-hover"
                                style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}
                            >
                                <X size={18} />
                            </button>
                        </header>

                        <div className="hk-slim-scroll space-y-7 overflow-y-auto px-6 py-6">
                            {sections.map((section, sectionIndex) => (
                                <motion.section
                                    key={section.title}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.28, delay: 0.04 + sectionIndex * 0.06, ease: [0.16, 1, 0.3, 1] }}
                                >
                                    <div className="mb-3 flex items-center gap-3">
                                        <h4
                                            className="text-[0.65rem] font-black uppercase tracking-[0.18em]"
                                            style={{ color: "var(--color-muted)" }}
                                        >
                                            {section.title}
                                        </h4>
                                        <span className="h-px flex-1" style={{ backgroundColor: "var(--color-border)" }} />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {section.fields.map((field) => (
                                            <RecordField
                                                key={field}
                                                name={field}
                                                label={FIELD_LABELS[field] || field.replaceAll("_", " ")}
                                                value={form[field] ?? ""}
                                                editable={editable}
                                                role={form.role}
                                                // Age follows the birthday and the ID number follows the
                                                // barcode; neither is typed directly.
                                                disabled={["updated_at", "age", "student_id"].includes(field)}
                                                onChange={(value) => updateField(field, value)}
                                            />
                                        ))}
                                    </div>
                                    
                                    {section.title === "Account" && form.barcode && (
                                        <div className="mt-5 flex flex-col items-center justify-center p-6 rounded-2xl border bg-white shadow-sm" style={{ borderColor: "var(--color-border)" }}>
                                            <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] mb-4" style={{ color: "var(--color-muted)" }}>Digital Barcode</p>
                                            <div className="w-full flex justify-center overflow-hidden">
                                                <Barcode 
                                                    value={form.barcode} 
                                                    background="transparent" 
                                                    lineColor="#000000" 
                                                    width={2} 
                                                    height={65} 
                                                    fontSize={15}
                                                    fontOptions="bold"
                                                    displayValue={true}
                                                    margin={0}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </motion.section>
                            ))}
                        </div>

                        <footer
                            className="flex justify-end gap-3 border-t px-6 py-5"
                            style={{ borderColor: "var(--color-border)" }}
                        >
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={saving}
                                className="rounded-2xl border px-5 py-2.5 text-sm font-black transition hk-soft-hover disabled:opacity-50"
                                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                            >
                                Close
                            </button>
                            {editable ? (
                                <button
                                    type="button"
                                    onClick={onSave}
                                    disabled={saving}
                                    className="rounded-2xl px-6 py-2.5 text-sm font-black transition hk-primary-hover disabled:opacity-70"
                                    style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-content)" }}
                                >
                                    {saving ? "Saving..." : "Save changes"}
                                </button>
                            ) : null}
                        </footer>
                    </motion.section>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );

    return createPortal(modal, document.body);
}

function HeaderChip({ value, tone }) {
    const primary = tone === "primary";

    return (
        <span
            className="inline-block max-w-[12rem] truncate rounded-full px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-wide"
            style={{
                backgroundColor: primary
                    ? "color-mix(in srgb, var(--color-primary) 12%, transparent)"
                    : "var(--color-surface)",
                color: primary ? "var(--color-primary)" : "var(--color-muted)",
                border: primary ? "none" : "1px solid var(--color-border)",
            }}
            title={value}
        >
            {value}
        </span>
    );
}

function RecordField({ name, label, value, editable, disabled, role, onChange }) {
    const labelEl = (
        <span className="text-[0.65rem] font-black uppercase tracking-[0.16em]" style={{ color: "var(--color-muted)" }}>
            {label}
        </span>
    );

    if (!editable) {
        // Checking for the letter "T" treated values such as "COLLEGE
        // INSTRUCTOR" as ISO timestamps and rendered them as "Invalid Date".
        // Only actual date fields should ever go through the date formatter.
        const isDateField = name === "birthday" || name.endsWith("_at");
        const display = name === "department"
            ? departmentLabel(value)
            : isDateField && value
                ? prettyDate(value)
                : value;

        // Reads as a profile card rather than a row of disabled inputs — no
        // borders, just the value given room and weight under its label.
        return (
            <div className="min-w-0 rounded-2xl px-4 py-3" style={{ backgroundColor: "var(--color-surface)" }}>
                {labelEl}
                <p
                    className="mt-1 break-words text-sm font-black leading-6"
                    style={{ color: display ? "var(--color-text)" : "var(--color-muted)" }}
                >
                    {display || "Not set"}
                </p>
            </div>
        );
    }

    if (name === "birthday") {
        return (
            <BirthdayPicker
                label={label}
                value={value ?? ""}
                onChange={onChange}
                disabled={disabled}
            />
        );
    }

    if (["department", "year_level", "program", "grade_level", "strand", "gender"].includes(name)) {
        let options = [];
        if (name === "department") options = departmentOptions(role);
        else if (name === "year_level") options = yearLevels;
        else if (name === "program") options = programs;
        else if (name === "grade_level") options = gradeLevels;
        else if (name === "strand") options = strands;
        else if (name === "gender") options = genders;

        return (
            <CustomSelectField
                label={label}
                value={value ?? ""}
                onChange={onChange}
                options={options}
                disabled={disabled}
            />
        );
    }

    const inputType = "text";
    const displayValue = value;

    return (
        <label className="block">
            {labelEl}
            <input
                type={inputType}
                value={displayValue}
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border px-4 text-sm font-bold outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                    backgroundColor: "var(--color-surface)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text)",
                }}
            />
        </label>
    );
}
