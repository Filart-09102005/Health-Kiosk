import { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    ArrowRight,
    ChevronDown,
    Check,
    Eye,
    EyeOff,
    Lock,
    Mail,
    Save,
    ShieldCheck,
    UserRound,
} from "lucide-react";
import AuthLayout from "./components/AuthLayout";
import BarcodeScanner from "./components/BarcodeScanner";
import RoleSelector from "./components/RoleSelector";
import Loader from "../Global/Loader";
import { useToast } from "../Global/Toast";
import { authService, getErrorMessage, getValidationErrors } from "./services/authService";

const steps = ["Scan ID", "Role", "Details", "Password"];
const schoolEmailDomain = "@smcbi.edu.ph";

const initialForm = {
    barcode: "",
    role: "",
    firstname: "",
    lastname: "",
    email: "",
    age: "",
    gender: "",
    department: "",
    grade_level: "",
    strand: "",
    year_level: "",
    program: "",
    password: "",
    password_confirmation: "",
};

const studentDepartments = ["COLLEGE", "BED"];

const gradeLevels = [
    "Grade 7",
    "Grade 8",
    "Grade 9",
    "Grade 10",
    "Grade 11",
    "Grade 12",
];

const seniorHighGrades = ["Grade 11", "Grade 12"];
const strands = ["ABM", "HUMSS", "STEM"];
const yearLevels = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const programs = ["BSIT", "BSED", "BEED", "BSHM", "BSBA"];

export default function Register({ navigate }) {
    const { showToast } = useToast();
    const [step, setStep] = useState(0);
    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [barcodeState, setBarcodeState] = useState({
        status: null,
        message: "",
        checking: false,
        available: false,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [saving, setSaving] = useState(false);
    const [autoProceeding, setAutoProceeding] = useState(false);

    const passwordRules = useMemo(
        () => [
            { label: "Minimum 8 characters", valid: form.password.length >= 8 },
            { label: "At least 1 uppercase letter", valid: /[A-Z]/.test(form.password) },
            { label: "At least 1 lowercase letter", valid: /[a-z]/.test(form.password) },
            { label: "At least 1 number", valid: /\d/.test(form.password) },
            { label: "At least 1 special character", valid: /[^A-Za-z0-9]/.test(form.password) },
        ],
        [form.password],
    );

    const strengthScore = passwordRules.filter((rule) => rule.valid).length;
    const strengthLabel = strengthScore <= 2 ? "Weak" : strengthScore <= 4 ? "Medium" : "Strong";
    const strengthColor =
        strengthLabel === "Strong"
            ? "var(--color-success)"
            : strengthLabel === "Medium"
              ? "var(--color-primary)"
              : "var(--color-error)";
    const isBed = form.department === "BED";
    const isCollege = form.department === "COLLEGE";
    const isFaculty = form.department === "FACULTY";
    const needsStrand = isBed && seniorHighGrades.includes(form.grade_level);
    const departmentOptions = form.role === "teacher" ? ["FACULTY"] : studentDepartments;

    const updateField = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: undefined }));
    };

    const updateSchoolEmail = (value) => {
        const cleanValue = value
            .toLowerCase()
            .replace(schoolEmailDomain, "")
            .replace(/[^a-z0-9._-]/g, "");

        updateField("email", cleanValue ? `${cleanValue}${schoolEmailDomain}` : "");
    };

    useEffect(() => {
        if (step !== 0 || ! barcodeState.available) {
            setAutoProceeding(false);
            return undefined;
        }

        setAutoProceeding(true);

        const timer = window.setTimeout(() => {
            setStep(1);
            setAutoProceeding(false);
        }, 1600);

        return () => window.clearTimeout(timer);
    }, [barcodeState.available, step]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [step]);

    useEffect(() => {
        setForm((current) => {
            if (current.role === "teacher" && current.department !== "FACULTY") {
                return {
                    ...current,
                    department: "FACULTY",
                    grade_level: "",
                    strand: "",
                    year_level: "",
                    program: "",
                };
            }

            if (current.role === "student" && current.department === "FACULTY") {
                return {
                    ...current,
                    department: "",
                    grade_level: "",
                    strand: "",
                    year_level: "",
                    program: "",
                };
            }

            return current;
        });
        setErrors((current) => ({ ...current, department: undefined }));
    }, [form.role]);

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

            if (! seniorHighGrades.includes(current.grade_level)) {
                next.strand = "";
            }

            return JSON.stringify(next) === JSON.stringify(current) ? current : next;
        });
        setErrors((current) => ({
            ...current,
            grade_level: form.department === "BED" ? current.grade_level : undefined,
            strand: needsStrand ? current.strand : undefined,
            year_level: form.department === "COLLEGE" ? current.year_level : undefined,
            program: form.department === "COLLEGE" ? current.program : undefined,
        }));
    }, [form.department, form.grade_level]);

    useEffect(() => {
        if (step !== 0 || ! form.barcode || barcodeState.checking || barcodeState.available) {
            return undefined;
        }

        const timer = window.setTimeout(() => {
            updateField("barcode", "");
            setBarcodeState({
                status: null,
                message: "",
                checking: false,
                available: false,
            });
        }, 3500);

        return () => window.clearTimeout(timer);
    }, [barcodeState.available, barcodeState.checking, form.barcode, step]);

    const barcodeStatusText = barcodeState.checking
        ? "Checking barcode..."
        : barcodeState.message || "Ready for barcode input";

    const handleBarcodeScan = async (barcode) => {
        updateField("barcode", barcode);
        setAutoProceeding(false);
        setBarcodeState({
            status: "info",
            message: "Checking barcode availability...",
            checking: true,
            available: false,
        });

        try {
            const response = await authService.checkBarcode(barcode);

            setBarcodeState({
                status: response.data.available ? "success" : "error",
                message: response.data.message,
                checking: false,
                available: response.data.available,
            });

            showToast({
                type: response.data.available ? "success" : "warning",
                title: response.data.available ? "Barcode available" : "Duplicate barcode",
                message: response.data.message,
            });
        } catch (error) {
            setBarcodeState({
                status: "error",
                message: getErrorMessage(error, "Barcode check failed."),
                checking: false,
                available: false,
            });
        }
    };

    const stepIsValid = () => {
        if (step === 0) return Boolean(form.barcode && barcodeState.available);
        if (step === 1) return Boolean(form.role);
        if (step === 2) {
            return Boolean(
                form.firstname &&
                    form.lastname &&
                    form.email &&
                    form.age &&
                    form.gender &&
                    form.department &&
                    (! isBed || form.grade_level) &&
                    (! needsStrand || form.strand) &&
                    (! isCollege || (form.year_level && form.program)) &&
                    (! isFaculty || form.department),
            );
        }
        if (step === 3) return strengthScore === 5 && form.password === form.password_confirmation;
        return true;
    };

    const goNext = () => {
        if (! stepIsValid()) {
            showToast({
                type: "warning",
                title: "Complete this step",
                message: "Please fill in the required information before continuing.",
            });
            return;
        }

        setStep((current) => Math.min(current + 1, steps.length - 1));
    };

    const submitRegistration = async () => {
        setSaving(true);
        setErrors({});

        try {
            const registrationPayload = {
                ...form,
                email: form.email.trim(),
                grade_level: isBed ? form.grade_level : undefined,
                strand: needsStrand ? form.strand : undefined,
                year_level: isCollege ? form.year_level : undefined,
                program: isCollege ? form.program : undefined,
            };

            await authService.register(registrationPayload);
            showToast({
                type: "success",
                title: "Registration saved",
                message: "Please check your email to verify your Health Kiosk account.",
            });
            navigate(`/verify-email?sent=1&email=${encodeURIComponent(form.email)}`);
        } catch (error) {
            setErrors(getValidationErrors(error));
            showToast({
                type: "error",
                title: "Registration failed",
                message: getErrorMessage(error),
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <AuthLayout
            eyebrow="Get Started"
            title="Create account"
            subtitle={`Step ${step + 1} of ${steps.length} - ${step === 0 ? "Scan your ID barcode" : step === 1 ? "Choose your role" : step === 2 ? "Complete your details" : "Create your password"}`}
            panelTitle="Create your account"
            panelDescription="Scan your ID barcode to join the campus health monitoring system."
            variant="register"
        >
            {saving ? <Loader label="Saving registration" fullscreen /> : null}

            <StepTracker currentStep={step} />

            <div className="mt-8">
                {step === 0 ? (
                    <div className="space-y-5">
                        <div className="rounded-xl border auth-panel px-6 py-5 text-center">
                            <div className="text-base font-black auth-strong-text">Scan your ID Barcode</div>
                            <p className="mt-2 text-sm font-semibold auth-muted-text">
                                Use the scanner to read the barcode on your school ID
                            </p>
                        </div>
                        <BarcodeScanner
                            value={form.barcode}
                            status={barcodeState.status}
                            message={barcodeStatusText}
                            onScan={handleBarcodeScan}
                        />
                        {autoProceeding ? (
                            <div className="text-center text-sm font-semibold" style={{ color: "var(--color-success)" }}>
                                Barcode accepted. Moving to role selection...
                            </div>
                        ) : null}
                    </div>
                ) : null}

                {step === 1 ? <RoleSelector value={form.role} onChange={(role) => updateField("role", role)} /> : null}

                {step === 2 ? (
                    <div className="space-y-6">
                        <div className="rounded-xl border auth-panel p-5">
                            <div className="flex items-center gap-3">
                                <ShieldCheck size={21} style={{ color: "var(--color-success)" }} />
                                <div>
                                    <div className="font-black auth-strong-text">Account details</div>
                                    <p className="text-sm font-semibold auth-muted-text">
                                        Fill out your profile and secure password.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <TextField icon={UserRound} label="First name" value={form.firstname} error={errors.firstname} onChange={(value) => updateField("firstname", value)} />
                            <TextField icon={UserRound} label="Last name" value={form.lastname} error={errors.lastname} onChange={(value) => updateField("lastname", value)} />
                            <SchoolEmailField
                                value={form.email}
                                error={errors.email}
                                onChange={updateSchoolEmail}
                            />
                            <TextField label="Age" type="number" value={form.age} error={errors.age} onChange={(value) => updateField("age", value)} />
                            <SelectField label="Gender" value={form.gender} error={errors.gender} onChange={(value) => updateField("gender", value)} options={[
                                ["", "Choose gender"],
                                ["male", "Male"],
                                ["female", "Female"],
                                ["other", "Other"],
                                ["prefer_not_to_say", "Prefer not to say"],
                            ]} />
                            <SelectField
                                label="Department"
                                value={form.department}
                                error={errors.department}
                                disabled={form.role === "teacher"}
                                helper={form.role === "teacher" ? "Teachers are assigned to Faculty." : ""}
                                onChange={(value) => updateField("department", value)}
                                options={[
                                    ["", "Choose department"],
                                    ...departmentOptions.map((department) => [department, department]),
                                ]}
                            />
                            {isBed ? (
                                <>
                                    <SelectField label="Grade Level" value={form.grade_level} error={errors.grade_level} onChange={(value) => updateField("grade_level", value)} options={[
                                        ["", "Choose grade level"],
                                        ...gradeLevels.map((gradeLevel) => [gradeLevel, gradeLevel]),
                                    ]} />
                                    {needsStrand ? (
                                        <SelectField label="Strand" value={form.strand} error={errors.strand} onChange={(value) => updateField("strand", value)} options={[
                                            ["", "Choose strand"],
                                            ...strands.map((strand) => [strand, strand]),
                                        ]} />
                                    ) : null}
                                </>
                            ) : null}
                            {isCollege ? (
                                <>
                                    <SelectField label="Year Level" value={form.year_level} error={errors.year_level} onChange={(value) => updateField("year_level", value)} options={[
                                        ["", "Choose year level"],
                                        ...yearLevels.map((yearLevel) => [yearLevel, yearLevel]),
                                    ]} />
                                    <SelectField label="Program" value={form.program} error={errors.program} onChange={(value) => updateField("program", value)} options={[
                                        ["", "Choose program"],
                                        ...programs.map((program) => [program, program]),
                                    ]} />
                                </>
                            ) : null}
                        </div>
                    </div>
                ) : null}

                {step === 3 ? (
                    <div className="space-y-6">
                        <div className="rounded-xl border auth-panel px-6 py-5">
                            <div className="flex items-center gap-3">
                                <ShieldCheck size={21} style={{ color: "var(--color-success)" }} />
                                <div>
                                    <div className="font-black auth-strong-text">Password security</div>
                                    <p className="text-sm font-semibold auth-muted-text">
                                        Create a strong password before saving your account.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-5">
                            <PasswordField
                                label="Password"
                                value={form.password}
                                show={showPassword}
                                error={errors.password}
                                onToggle={() => setShowPassword((current) => ! current)}
                                onChange={(value) => updateField("password", value)}
                            />
                            <PasswordField
                                label="Confirm password"
                                value={form.password_confirmation}
                                show={showConfirmPassword}
                                error={errors.password_confirmation}
                                onToggle={() => setShowConfirmPassword((current) => ! current)}
                                onChange={(value) => updateField("password_confirmation", value)}
                            />

                            <div className="rounded-xl border p-5 auth-panel">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-sm font-bold">Password strength</span>
                                    <span className="text-sm font-black" style={{ color: strengthColor }}>{strengthLabel}</span>
                                </div>
                                <div className="mt-3 h-3 overflow-hidden rounded-full" style={{ backgroundColor: "var(--auth-border)" }}>
                                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(strengthScore / 5) * 100}%`, backgroundColor: strengthColor }} />
                                </div>
                                <div className="mt-4 grid gap-2 md:grid-cols-2">
                                    {passwordRules.map((rule) => (
                                        <div key={rule.label} className="flex items-center gap-2 text-sm" style={{ color: rule.valid ? "var(--color-success)" : "var(--color-muted)" }}>
                                            <Check size={15} />
                                            {rule.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (stepIsValid()) {
                                        submitRegistration();
                                    } else {
                                        goNext();
                                    }
                                }}
                                className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 font-black text-white shadow-[0_20px_55px_rgba(15,118,110,0.22)] transition hover:-translate-y-0.5"
                                style={{ backgroundColor: "var(--color-primary)" }}
                            >
                                <Save size={18} />
                                Save and Register
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>

            <div className="mt-8 flex items-center justify-between gap-3">
                {step > 0 ? (
                    <button
                        type="button"
                        onClick={() => setStep((current) => Math.max(current - 1, 0))}
                        className="flex items-center gap-2 rounded-xl border px-5 py-3 font-bold auth-muted-text transition hover:-translate-y-0.5"
                        style={{ borderColor: "var(--auth-border)" }}
                    >
                        <ArrowLeft size={18} />
                        Back
                    </button>
                ) : <span />}
                {step > 0 && step < steps.length - 1 ? (
                    <button
                        type="button"
                        onClick={goNext}
                        disabled={barcodeState.checking}
                        className="flex items-center gap-2 rounded-xl px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-60"
                        style={{ backgroundColor: "var(--color-primary)" }}
                    >
                        Continue
                        <ArrowRight size={18} />
                    </button>
                ) : null}
            </div>

            <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center text-sm font-semibold auth-muted-text">
                <span className="h-px" style={{ backgroundColor: "var(--auth-border)" }} />
                <span>Already have an account?</span>
                <span className="h-px" style={{ backgroundColor: "var(--auth-border)" }} />
            </div>
            <div className="mt-5 text-center">
                <button type="button" onClick={() => navigate("/login")} className="font-black" style={{ color: "var(--color-primary)" }}>
                Sign in instead
                </button>
            </div>
        </AuthLayout>
    );
}

function StepTracker({ currentStep }) {
    return (
        <div className="mt-8 flex items-center">
            {steps.map((label, index) => {
                const active = index === currentStep;
                const complete = index < currentStep;

                return (
                    <div key={label} className="flex flex-1 items-center last:flex-none">
                        <div className="flex items-center gap-2">
                            <div
                                className="flex h-7 w-7 items-center justify-center rounded-full border text-xs font-black"
                                style={{
                                    backgroundColor: active ? "rgba(34,211,238,0.16)" : complete ? "var(--color-primary)" : "rgba(255,255,255,0.08)",
                                    borderColor: active ? "#22d3ee" : complete ? "var(--color-primary)" : "rgba(255,255,255,0.12)",
                                    color: active ? "#22d3ee" : complete ? "#ffffff" : "var(--color-muted)",
                                }}
                            >
                                {complete ? <Check size={14} /> : index + 1}
                            </div>
                            <span className="whitespace-nowrap text-sm font-black" style={{ color: active || complete ? "var(--auth-text)" : "var(--auth-muted)" }}>
                                {label}
                            </span>
                        </div>
                        {index < steps.length - 1 ? <div className="mx-3 h-px flex-1" style={{ backgroundColor: "var(--auth-border)" }} /> : null}
                    </div>
                );
            })}
        </div>
    );
}

function TextField({ label, value, onChange, error, type = "text", icon: Icon }) {
    return (
        <label className="block text-left">
            <span className="text-sm font-black auth-strong-text">{label}</span>
            <div className="mt-2 flex min-h-[3.25rem] items-center gap-3 rounded-xl border px-4 auth-control" style={{ borderColor: error ? "var(--color-error)" : undefined }}>
                {Icon ? <Icon size={18} style={{ color: "var(--color-muted)" }} /> : null}
                <input
                    type={type}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="w-full bg-transparent text-sm font-semibold outline-none"
                />
            </div>
            {error ? <span className="mt-1 block text-xs" style={{ color: "var(--color-error)" }}>{error[0]}</span> : null}
        </label>
    );
}

function SchoolEmailField({ value, onChange, error }) {
    const localPart = value.endsWith(schoolEmailDomain)
        ? value.slice(0, -schoolEmailDomain.length)
        : value;
    const previewEmail = `${localPart}${schoolEmailDomain}`;

    return (
        <label className="block text-left md:col-span-2">
            <span className="text-sm font-black auth-strong-text">School Email</span>
            <div
                className="mt-2 flex min-h-[3.25rem] w-full flex-wrap items-center gap-3 rounded-xl border px-4 py-2 auth-control sm:flex-nowrap"
                style={{ borderColor: error ? "var(--color-error)" : undefined }}
            >
                <Mail size={18} style={{ color: "var(--color-muted)" }} />
                <input
                    type="text"
                    value={localPart}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder="firstname.lastname"
                    className="min-w-[12rem] flex-1 bg-transparent text-sm font-semibold outline-none"
                    autoComplete="username"
                />
                <span className="shrink-0 rounded-lg px-3 py-1.5 text-[0.7rem] font-black" style={{ backgroundColor: "var(--auth-panel)", color: "var(--color-primary)" }}>
                    {schoolEmailDomain}
                </span>
            </div>
            {error ? (
                <span className="mt-1 block text-xs" style={{ color: "var(--color-error)" }}>
                    {error[0]}
                </span>
            ) : localPart ? (
                <span className="mt-2 block text-xs leading-5" style={{ color: "var(--color-muted)" }}>
                    <span
                        className="rounded-lg px-2 py-1 font-black"
                        style={{
                            backgroundColor: "color-mix(in srgb, var(--color-primary), transparent 86%)",
                            color: "var(--color-primary)",
                        }}
                    >
                        {previewEmail}
                    </span>
                </span>
            ) : null}
        </label>
    );
}

function SelectField({ label, value, onChange, error, options, disabled, helper }) {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState("bottom");
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleDropdown = () => {
        if (disabled) return;
        if (!isOpen && dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            if (spaceBelow < 250 && spaceAbove > spaceBelow) {
                setDropdownPosition("top");
            } else {
                setDropdownPosition("bottom");
            }
        }
        setIsOpen(!isOpen);
    };

    const selectedOption = options.find((opt) => opt[0] === value) || options[0];

    return (
        <div className="block text-left" ref={dropdownRef}>
            <span className="text-sm font-black auth-strong-text">{label}</span>
            <div className="relative mt-2">
                <button
                    type="button"
                    onClick={toggleDropdown}
                    className={`min-h-[3.25rem] w-full flex items-center justify-between rounded-xl border px-4 text-sm font-bold uppercase outline-none transition auth-control ${disabled ? "opacity-50 cursor-not-allowed" : "hover:-translate-y-0.5"}`}
                    style={{
                        borderColor: error ? "var(--color-error)" : undefined,
                        color: value ? "var(--auth-text)" : "var(--color-muted)",
                    }}
                >
                    <span className="truncate">{selectedOption[1]}</span>
                    <span
                        className="flex items-center justify-center transition-transform duration-300 text-muted-foreground"
                        style={{
                            color: "var(--auth-muted)",
                            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)"
                        }}
                    >
                        <ChevronDown size={18} strokeWidth={1.5} />
                    </span>
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: dropdownPosition === "top" ? 10 : -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: dropdownPosition === "top" ? 10 : -10 }}
                            transition={{ duration: 0.15 }}
                            className={`absolute left-0 z-50 w-full rounded-xl border p-1 shadow-xl overflow-hidden auth-panel ${
                                dropdownPosition === "top" ? "bottom-full mb-2" : "top-full mt-2"
                            }`}
                            style={{ 
                                borderColor: "var(--color-border)", 
                                backgroundColor: "var(--color-card)",
                                backdropFilter: "blur(12px)" 
                            }}
                        >
                            <div className="max-h-60 overflow-y-auto hk-sidebar-scroll space-y-0.5 p-1">
                                {options.map(([optionValue, optionLabel], idx) => {
                                    if (idx === 0) return null; // Skip the "Choose..." placeholder in the list

                                    return (
                                        <button
                                            key={optionValue}
                                            type="button"
                                            className={`w-full flex items-center px-4 py-3 text-sm font-bold uppercase rounded-lg transition-colors text-left ${value === optionValue ? '' : 'hover:opacity-75'}`}
                                            style={{
                                                color: value === optionValue ? "var(--color-primary)" : "var(--color-text)",
                                                backgroundColor: value === optionValue ? "color-mix(in srgb, var(--color-primary), transparent 90%)" : undefined
                                            }}
                                            onClick={() => {
                                                onChange(optionValue);
                                                setIsOpen(false);
                                            }}
                                        >
                                            {optionLabel}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            {helper ? <span className="mt-1 block text-xs" style={{ color: "var(--color-muted)" }}>{helper}</span> : null}
            {error ? <span className="mt-1 block text-xs" style={{ color: "var(--color-error)" }}>{error[0]}</span> : null}
        </div>
    );
}

function PasswordField({ label, value, show, onToggle, onChange, error }) {
    return (
        <label className="block text-left">
            <span className="text-sm font-black auth-strong-text">{label}</span>
            <div className="mt-2 flex min-h-[3.25rem] items-center gap-3 rounded-xl border px-4 auth-control" style={{ borderColor: error ? "var(--color-error)" : undefined }}>
                <Lock size={18} style={{ color: "var(--color-muted)" }} />
                <input
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="w-full bg-transparent text-sm font-semibold outline-none"
                />
                <button type="button" onClick={onToggle} className="rounded-lg p-1 transition hover:scale-105" style={{ color: "var(--color-muted)" }}>
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
            {error ? <span className="mt-1 block text-xs" style={{ color: "var(--color-error)" }}>{error[0]}</span> : null}
        </label>
    );
}

function Summary({ label, value }) {
    return (
        <div className="flex items-center justify-between rounded-2xl border px-4 py-3" style={{ borderColor: "var(--color-border)" }}>
            <span className="text-sm font-bold" style={{ color: "var(--color-muted)" }}>{label}</span>
            <span className="text-sm font-black capitalize">{value || "Not provided"}</span>
        </div>
    );
}
