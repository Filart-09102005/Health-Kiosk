import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, UserPlus, Sparkles, KeyRound, Eye, EyeOff, Loader2, Info } from "lucide-react";
import { createPortal } from "react-dom";
import useModalLayer from "../../../../Global/useModalLayer";
import CustomSelectField from "../../../../Global/CustomSelectField";
import BirthdayPicker from "../../../../Global/BirthdayPicker";
import { departmentOptionsFor, departmentsFor, isStaffRole } from "../../../../Global/departments";
import ConfirmDialog from "../../../../Global/ConfirmDialog";
import WaveLoader from "../../../../Global/WaveLoader";
import { authService, getErrorMessage } from "../../../Auth/services/authService";
import { useToast } from "../../../../Global/Toast";

const schoolEmailDomain = "@smcbi.edu.ph";

const gradeLevels = [
    { value: "Grade 7", label: "Grade 7" },
    { value: "Grade 8", label: "Grade 8" },
    { value: "Grade 9", label: "Grade 9" },
    { value: "Grade 10", label: "Grade 10" },
    { value: "Grade 11", label: "Grade 11" },
    { value: "Grade 12", label: "Grade 12" },
];

const seniorHighGrades = ["Grade 11", "Grade 12"];

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

function computeAge(dateString) {
    if (!dateString) return null;
    const today = new Date();
    const birthDate = new Date(dateString);
    if (isNaN(birthDate.getTime())) return null;
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age >= 0 ? age : null;
}

const EMPTY_FORM = {
    firstname: "",
    lastname: "",
    student_id: "",
    email: "",
    role: "",
    department: "",
    birthday: "",
    gender: "",
    barcode: "",
    grade_level: "",
    strand: "",
    year_level: "",
    program: "",
};

export default function AddUserModal({ open, onClose, defaultRole = "student", onSuccess }) {
    useModalLayer(open);
    const { showToast } = useToast();

    // Students and staff have their own page, so the role is settled before the
    // form opens. Offering it as a choice only let a student be created from the
    // teacher page, and left the field blank until someone remembered to set it.
    const role = isStaffRole(defaultRole) ? "personnel" : "student";
    const isStaff = role === "personnel";

    const [form, setForm] = useState({ ...EMPTY_FORM, role });

    const isBed = form.department === "BED" && !isStaff;
    const isCollege = form.department === "COLLEGE" && !isStaff;
    const needsStrand = isBed && seniorHighGrades.includes(form.grade_level);

    const [confirmCancel, setConfirmCancel] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [emailManuallyEdited, setEmailManuallyEdited] = useState(false);

    const updateSchoolEmail = (value) => {
        setEmailManuallyEdited(true);
        const cleanValue = value.toLowerCase().replace(schoolEmailDomain, "").replace(/[^a-z0-9._-]/g, "");
        setForm((prev) => ({ ...prev, email: cleanValue ? `${cleanValue}${schoolEmailDomain}` : "" }));
    };

    const handleChange = (key, value) => {
        setForm((prev) => {
            const next = { ...prev, [key]: value };
            
            // Auto-generate email if firstname/lastname change and email hasn't been manually edited
            if ((key === "firstname" || key === "lastname") && !emailManuallyEdited) {
                const fName = (key === "firstname" ? value : prev.firstname) || "";
                const lName = (key === "lastname" ? value : prev.lastname) || "";
                
                if (fName || lName) {
                    const cleanFirst = fName.toLowerCase().replace(/\s+/g, "");
                    const cleanLast = lName.toLowerCase().replace(/\s+/g, "");
                    const combined = [cleanFirst, cleanLast].filter(Boolean).join("");
                    next.email = combined ? `${combined}${schoolEmailDomain}` : "";
                } else {
                    next.email = "";
                }
            }
            
            return next;
        });
    };

    // Anything typed so far. Closing a blank form has nothing to confirm, so the
    // dialog only appears when the admin would actually lose work.
    const hasEnteredData = Object.values(form).some((value) => String(value ?? "").trim() !== "");

    /** All three close affordances route through here. */
    const requestClose = () => {
        if (isSubmitting) return;

        if (hasEnteredData) {
            setConfirmCancel(true);
            return;
        }

        onClose();
    };

    const discardAndClose = () => {
        setConfirmCancel(false);
        setForm(EMPTY_FORM);
        setEmailManuallyEdited(false);
        onClose();
    };

    // The modal is never unmounted, only hidden, so its state survives a close.
    // Clearing on open means every account starts from a blank form whether the
    // last one was created or cancelled.
    useEffect(() => {
        if (!open) return;

        setForm({ ...EMPTY_FORM, role });
        setEmailManuallyEdited(false);
        setShowPassword(false);
    }, [open, role]);

    // A department left over from the other kind of account is dropped rather
    // than submitted, so staff can never be filed under a student cohort.
    useEffect(() => {
        setForm((current) => {
            const department = departmentsFor(role).includes(current.department) ? current.department : "";

            if (!isStaff && department === current.department) return current;

            return isStaff
                ? { ...current, department, grade_level: "", strand: "", year_level: "", program: "" }
                : { ...current, department };
        });
    }, [role, isStaff]);

    useEffect(() => {
        setForm((current) => {
            const next = { ...current };

            if (current.department !== "BED") {
                next.grade_level = "";
                next.strand = "";
            }

            if (current.department !== "COLLEGE") {
                next.year_level = "";
                next.program = "";
            }

            if (!seniorHighGrades.includes(current.grade_level)) {
                next.strand = "";
            }

            return JSON.stringify(next) === JSON.stringify(current) ? current : next;
        });
    }, [form.department, form.grade_level]);

    const bufferRef = useRef("");
    const lastKeyTimeRef = useRef(0);

    useEffect(() => {
        const handleKeyDown = (event) => {
            const now = Date.now();
            const isFastInput = now - lastKeyTimeRef.current < 80;

            if (event.key === "Enter") {
                const scanned = bufferRef.current.trim();
                if (scanned.length >= 4) {
                    handleChange("barcode", scanned);
                }
                bufferRef.current = "";
                event.preventDefault();
                return;
            }

            if (event.key.length !== 1) {
                return;
            }

            bufferRef.current = isFastInput ? bufferRef.current + event.key : event.key;
            lastKeyTimeRef.current = now;
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Birthday and gender were marked required and then never checked, so
        // an account could be created with both blank and the admin was told it
        // had worked.
        const missing = [
            [!form.firstname.trim(), "First name"],
            [!form.lastname.trim(), "Last name"],
            [!form.email.trim(), "School email"],
            [!form.department, "Department"],
            [!form.birthday, "Birthday"],
            [!form.gender, "Gender"],
        ].filter(([isMissing]) => isMissing).map(([, name]) => name);

        if (missing.length) {
            showToast({
                type: "error",
                title: missing.length === 1 ? "Required field" : "Required fields",
                message: missing.join(", ") + (missing.length === 1 ? " is required." : " are required."),
            });
            return;
        }

        if (!form.email.endsWith("@smcbi.edu.ph")) {
            showToast({ type: "error", title: "Invalid Email", message: "School email must end with @smcbi.edu.ph" });
            return;
        }
        setIsSubmitting(true);

        try {
            // Remove spaces from firstname for the password
            const passwordFirstname = form.firstname.trim().replace(/\s+/g, '');
            const generatedPassword = `${passwordFirstname}12345`;
            const response = await authService.adminCreateUser({
                firstname: form.firstname.trim(),
                lastname: form.lastname.trim(),
                email: form.email.trim().toLowerCase(),
                password: generatedPassword,
                password_confirmation: generatedPassword,
                role,
                department: form.department,
                birthday: form.birthday || undefined,
                gender: form.gender || undefined,
                barcode: form.barcode.trim() || undefined,
                grade_level: isBed ? form.grade_level : undefined,
                strand: needsStrand ? form.strand : undefined,
                year_level: isCollege ? form.year_level : undefined,
                program: isCollege ? form.program : undefined,
            });

            showToast({
                type: "success",
                title: "User Created",
                message: response.data?.message || (isStaff ? "New teacher / staff account created successfully." : "New student account created successfully."),
            });

            setForm({ ...EMPTY_FORM, role });
            setEmailManuallyEdited(false);

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            showToast({
                type: "error",
                title: "Creation Failed",
                message: getErrorMessage(error, "Failed to create user account."),
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const modalContent = (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[9500] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={requestClose}
                        className="fixed inset-0 bg-black/75 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        className="hk-slim-scroll relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border p-6 sm:p-7 shadow-2xl space-y-6"
                        style={{ backgroundColor: "var(--color-bg)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                    >
                        <div className="flex items-start justify-between gap-4 border-b pb-4" style={{ borderColor: "var(--color-border)" }}>
                            <div className="flex items-center gap-3">
                                <div
                                    className="flex h-12 w-12 items-center justify-center rounded-2xl border shrink-0"
                                    style={{
                                        backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, var(--color-surface))",
                                        borderColor: "color-mix(in srgb, var(--color-primary) 30%, transparent)",
                                        color: "var(--color-primary)",
                                    }}
                                >
                                    <UserPlus size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--color-primary)" }}>
                                        <Sparkles size={12} />
                                        Admin Creation Portal
                                    </p>
                                    <h3 className="text-xl font-black" style={{ color: "var(--color-text)" }}>
                                        Add New {isStaff ? "Teacher / Staff" : "Student"} Account
                                    </h3>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={requestClose}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition hk-soft-hover"
                                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-muted)" }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-black mb-1.5" style={{ color: "var(--color-muted)" }}>First Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.firstname}
                                        onChange={(e) => handleChange("firstname", e.target.value)}
                                        placeholder="e.g. Hans"
                                        className="h-11 w-full rounded-xl border px-3.5 text-xs font-black outline-none transition focus:ring-2"
                                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black mb-1.5" style={{ color: "var(--color-muted)" }}>Last Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.lastname}
                                        onChange={(e) => handleChange("lastname", e.target.value)}
                                        placeholder="e.g. Filart"
                                        className="h-11 w-full rounded-xl border px-3.5 text-xs font-black outline-none transition focus:ring-2"
                                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <SchoolEmailField value={form.email} onChange={updateSchoolEmail} />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-black mb-1.5" style={{ color: "var(--color-muted)" }}>Role</label>
                                    <div
                                        className="flex h-11 items-center gap-2 rounded-xl border px-3.5 text-xs font-black"
                                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-muted)" }}
                                    >
                                        <span
                                            className="rounded-md px-2 py-0.5 text-[10px] tracking-wide"
                                            style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 15%, transparent)", color: "var(--color-primary)" }}
                                        >
                                            {isStaff ? "PERSONNEL" : "STUDENT"}
                                        </span>
                                        <span>Set by this page</span>
                                    </div>
                                </div>

                                <CustomSelectField
                                    label="Department *"
                                    value={form.department}
                                    onChange={(value) => handleChange("department", value)}
                                    options={departmentOptionsFor(role)}
                                />
                            </div>

                            {isBed && (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <CustomSelectField
                                        label="Grade Level"
                                        value={form.grade_level}
                                        onChange={(value) => handleChange("grade_level", value)}
                                        options={[{ value: "", label: "Choose grade level" }, ...gradeLevels]}
                                    />
                                    {needsStrand && (
                                        <CustomSelectField
                                            label="Strand"
                                            value={form.strand}
                                            onChange={(value) => handleChange("strand", value)}
                                            options={[{ value: "", label: "Choose strand" }, ...strands]}
                                        />
                                    )}
                                </div>
                            )}

                            {isCollege && (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <CustomSelectField
                                        label="Year Level"
                                        value={form.year_level}
                                        onChange={(value) => handleChange("year_level", value)}
                                        options={[{ value: "", label: "Choose year level" }, ...yearLevels]}
                                    />
                                    <CustomSelectField
                                        label="Program"
                                        value={form.program}
                                        onChange={(value) => handleChange("program", value)}
                                        options={[{ value: "", label: "Choose program" }, ...programs]}
                                    />
                                </div>
                            )}

                            <div className="grid gap-4 sm:grid-cols-3">
                                <BirthdayPicker
                                    label="Birthday"
                                    value={form.birthday}
                                    onChange={(value) => handleChange("birthday", value)}
                                    badge={
                                        form.birthday && computeAge(form.birthday) !== null ? (
                                            <span
                                                className="rounded-md px-2 py-0.5 text-[10px] font-bold"
                                                style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 15%, transparent)", color: "var(--color-primary)" }}
                                            >
                                                {computeAge(form.birthday)} yrs old
                                            </span>
                                        ) : null
                                    }
                                />

                                <CustomSelectField
                                    label="Gender *"
                                    value={form.gender}
                                    onChange={(value) => handleChange("gender", value)}
                                    options={[
                                        { value: "", label: "Choose gender" },
                                        { value: "male", label: "Male" },
                                        { value: "female", label: "Female" },
                                        { value: "other", label: "Other" },
                                    ]}
                                />

                                <div>
                                    <label className="block text-xs font-black mb-1.5" style={{ color: "var(--color-muted)" }}>Barcode (Optional)</label>
                                    <input
                                        type="text"
                                        value={form.barcode}
                                        onChange={(e) => handleChange("barcode", e.target.value)}
                                        placeholder="Type or scan barcode..."
                                        className="h-11 w-full rounded-xl border px-3 text-xs font-black outline-none transition focus:ring-2"
                                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                                    />
                                </div>
                            </div>

                            <div className="rounded-xl border p-3.5 mb-2 mt-4 text-xs shadow-sm" style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 8%, transparent)", borderColor: "color-mix(in srgb, var(--color-primary) 20%, transparent)" }}>
                                <p className="font-bold mb-1.5 flex items-center gap-1.5" style={{ color: "var(--color-primary)" }}>
                                    <Info size={14} /> Account Setup Information
                                </p>
                                <ul className="list-disc pl-5 space-y-1.5 leading-relaxed" style={{ color: "color-mix(in srgb, var(--color-text) 85%, transparent)" }}>
                                    <li>The user's email is <strong>automatically verified</strong> so they can log in immediately.</li>
                                    <li>Leaving <strong>Barcode</strong> blank does not leave the account without one &mdash; the kiosk needs something to scan, so a code is <strong>generated automatically</strong> and shown on the account afterwards.</li>
                                    <li>The default password is set to: <strong className="px-1.5 py-0.5 rounded-md" style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 15%, transparent)", color: "var(--color-primary)" }}>{form.firstname ? `${form.firstname.trim().replace(/\s+/g, '')}12345` : "[First Name]12345"}</strong></li>
                                </ul>
                            </div>

                            <div className="sticky bottom-0 mt-6 -mx-6 -mb-6 flex items-center justify-end gap-3 rounded-b-2xl border-t p-4" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                                <button
                                    type="button"
                                    onClick={requestClose}
                                    className="h-11 rounded-xl border px-5 text-xs font-black transition-all hk-soft-hover"
                                    style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-muted)" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex h-11 min-w-[150px] items-center justify-center gap-2 rounded-xl px-6 text-xs font-black transition-all shadow-md hk-primary-hover disabled:opacity-50"
                                    style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-content)" }}
                                >
                                    {isSubmitting ? (
                                        <WaveLoader color="currentColor" />
                                    ) : (
                                        <>
                                            <UserPlus size={16} />
                                            <span>Add New {isStaff ? "Teacher" : "Student"}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return (
        <>
            {createPortal(modalContent, document.body)}

            <ConfirmDialog
                open={confirmCancel}
                // Above the modal's own 9500 layer, or it would paint behind it.
                zIndex={9800}
                title="Discard this account?"
                message="You have started filling in this form. Cancelling now clears every field and no account is created."
                confirmLabel="Yes, discard"
                cancelLabel="Keep editing"
                onConfirm={discardAndClose}
                onCancel={() => setConfirmCancel(false)}
            />
        </>
    );
}


function SchoolEmailField({ value, onChange, error }) {
    const [atTypedNotice, setAtTypedNotice] = useState(false);
    const localPart = value.endsWith(schoolEmailDomain)
        ? value.slice(0, -schoolEmailDomain.length)
        : value;
    const previewEmail = `${localPart}${schoolEmailDomain}`;

    const handleInputChange = (e) => {
        const raw = e.target.value;
        if (raw.includes("@")) {
            setAtTypedNotice(true);
            setTimeout(() => setAtTypedNotice(false), 3000);
        }
        onChange(raw);
    };

    return (
        <label className="block text-left w-full">
            <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-black" style={{ color: "var(--color-muted)" }}>School Email (@smcbi.edu.ph) *</span>
                <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color: "var(--color-primary)" }}>
                    <Info size={13} /> Username only
                </span>
            </div>

            <div className="relative flex items-center">
                <input
                    type="text"
                    required
                    value={localPart}
                    onChange={handleInputChange}
                    placeholder="user"
                    className="h-11 w-full rounded-xl border pl-3.5 pr-[110px] text-xs font-black outline-none transition focus:ring-2"
                    style={{
                        backgroundColor: "var(--color-surface)",
                        borderColor: error ? "var(--color-error)" : "var(--color-border)",
                        color: "var(--color-text)",
                    }}
                />
                <span
                    className="pointer-events-none absolute right-3 text-xs font-black"
                    style={{ color: "var(--color-primary)" }}
                >
                    {schoolEmailDomain}
                </span>
            </div>

            <AnimatePresence>
                {atTypedNotice && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute z-10 mt-2 flex items-start gap-2 rounded-lg border p-2 text-xs shadow-lg"
                        style={{
                            backgroundColor: "var(--color-surface)",
                            borderColor: "var(--color-primary)",
                            color: "var(--color-text)",
                        }}
                    >
                        <Info size={14} className="shrink-0" />
                        <span>No need to type <strong>@</strong> - <strong>{schoolEmailDomain}</strong> is attached automatically on the right!</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {error ? (
                <span className="mt-1.5 block text-[0.78rem] font-bold" style={{ color: "var(--color-error)" }}>
                    {error}
                </span>
            ) : localPart ? (
                <span className="mt-2 block text-[0.78rem] leading-5" style={{ color: "var(--color-muted)" }}>
                    Full email address:{" "}
                    <span
                        className="rounded-lg px-2 py-1 font-black"
                        style={{ backgroundColor: "color-mix(in srgb, var(--color-primary), transparent 86%)", color: "var(--color-primary)" }}
                    >
                        {previewEmail}
                    </span>
                </span>
            ) : (
                <span className="mt-1.5 block text-[0.78rem] leading-4" style={{ color: "var(--color-muted)" }}>
                    Type your username only (e.g., <strong>juan.delacruz</strong>).
                </span>
            )}
        </label>
    );
}
