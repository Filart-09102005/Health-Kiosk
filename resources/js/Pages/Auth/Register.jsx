import { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    ArrowRight,
    ChevronDown,
    Check,
    Eye,
    EyeOff,
    Info,
    Lock,
    Mail,
    Save,
    ShieldCheck,
    UserRound,
    Calendar,
} from "lucide-react";
import AuthLayout from "./components/AuthLayout";
import BarcodeScanner from "./components/BarcodeScanner";
import RoleSelector from "./components/RoleSelector";
import Loader from "../Global/Loader";
import BirthdayPicker from "../../Global/BirthdayPicker";
import SelectField from "../Global/SelectField";
import { useToast } from "../Global/Toast";
import { authService, getErrorMessage, getValidationErrors } from "./services/authService";
import Tooltip from "../Global/Tooltip";

const steps = ["Scan ID", "Role", "Details", "Password"];
const schoolEmailDomain = "@smcbi.edu.ph";

const initialForm = {
    barcode: "",
    role: "",
    firstname: "",
    lastname: "",
    email: "",
    birthday: "",
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
const personnelDepartments = ["COLLEGE INSTRUCTOR", "BED INSTRUCTOR", "NTP"];

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
    const [emailCheckState, setEmailCheckState] = useState({
        status: null,
        message: "",
        checking: false,
        available: false,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [saving, setSaving] = useState(false);
    const [autoProceeding, setAutoProceeding] = useState(false);
    const [emailManuallyEdited, setEmailManuallyEdited] = useState(false);
    const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

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
    const isBed = form.department === "BED" && form.role === "student";
    const isCollege = form.department === "COLLEGE" && form.role === "student";
    const needsStrand = isBed && seniorHighGrades.includes(form.grade_level);
    const departmentOptions = form.role === "teacher" ? personnelDepartments : studentDepartments;

    const getDepartmentLabel = (dept, role) => {
        if (dept === "COLLEGE") return "College Students";
        if (dept === "BED") return "Basic Education (BED) Students";
        if (dept === "COLLEGE INSTRUCTOR") return "College Instructors";
        if (dept === "BED INSTRUCTOR") return "Basic Education (BED) Instructors";
        if (dept === "NTP") return "Non-Teaching Personnel (NTP)";
        return dept;
    };

    const calculateAge = (birthday) => {
        if (!birthday) return null;
        const birthDate = new Date(birthday);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };
    const computedAge = calculateAge(form.birthday);

    const updateField = (field, value) => {
        setForm((current) => {
            const next = { ...current, [field]: value };

            if ((field === "firstname" || field === "lastname") && !emailManuallyEdited) {
                const fName = (field === "firstname" ? value : current.firstname) || "";
                const lName = (field === "lastname" ? value : current.lastname) || "";
                
                if (fName || lName) {
                    const cleanName = (fName + lName).toLowerCase().replace(/[^a-z0-9._-]/g, "");
                    next.email = cleanName ? `${cleanName}${schoolEmailDomain}` : "";
                } else {
                    next.email = "";
                }
            }

            return next;
        });
        setErrors((current) => ({ ...current, [field]: undefined }));
    };

    const updateSchoolEmail = (value) => {
        setEmailManuallyEdited(true);
        const cleanValue = value
            .toLowerCase()
            .replace(schoolEmailDomain, "")
            .replace(/[^a-z0-9._-]/g, "");

        setForm((current) => ({ ...current, email: cleanValue ? `${cleanValue}${schoolEmailDomain}` : "" }));
        setErrors((current) => ({ ...current, email: undefined }));
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
        }, 3000);

        return () => window.clearTimeout(timer);
    }, [barcodeState.available, step]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [step]);

    useEffect(() => {
        if (!form.email || form.email.length <= schoolEmailDomain.length) {
            setEmailCheckState({ status: null, message: "", checking: false, available: false });
            return;
        }

        setEmailCheckState(prev => ({ ...prev, status: null, checking: true, available: false }));

        const timer = setTimeout(async () => {
            try {
                const response = await authService.checkEmail(form.email);
                setEmailCheckState({
                    status: response.data.available ? "success" : "error",
                    message: response.data.message,
                    checking: false,
                    available: response.data.available,
                });
            } catch (error) {
                setEmailCheckState({
                    status: "error",
                    message: "Email check failed.",
                    checking: false,
                    available: false,
                });
            }
        }, 600);

        return () => clearTimeout(timer);
    }, [form.email]);

    useEffect(() => {
        setForm((current) => {
            if (current.role === "teacher") {
                return {
                    ...current,
                    grade_level: "",
                    strand: "",
                    year_level: "",
                    program: "",
                    department: personnelDepartments.includes(current.department) ? current.department : "",
                };
            }

            if (current.role === "student") {
                return {
                    ...current,
                    department: studentDepartments.includes(current.department) ? current.department : "",
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

    const getMissingFieldsMessage = () => {
        const missing = [];
        if (step === 0) {
            if (!form.barcode) missing.push("Barcode");
            else if (!barcodeState.available) missing.push("Valid Barcode");
        }
        if (step === 1) {
            if (!form.role) missing.push("Role");
        }
        if (step === 2) {
            if (!form.firstname) missing.push("First name");
            if (!form.lastname) missing.push("Last name");
            if (!form.email) missing.push("Email");
            else if (emailCheckState.checking) missing.push("Wait for email verification");
            else if (!emailCheckState.available) missing.push("Unique Email");
            if (!form.birthday) missing.push("Birthday");
            if (!form.gender) missing.push("Gender");
            if (!form.department) missing.push("Department");
            if (isBed && !form.grade_level) missing.push("Grade Level");
            if (needsStrand && !form.strand) missing.push("Strand");
            if (isCollege) {
                if (!form.year_level) missing.push("Year Level");
                if (!form.program) missing.push("Program");
            }
        }
        if (step === 3) {
            if (strengthScore !== 5) missing.push("Strong Password");
            if (form.password !== form.password_confirmation) missing.push("Matching Passwords");
        }
        return missing;
    };

    const goNext = () => {
        const missing = getMissingFieldsMessage();
        if (missing.length > 0) {
            showToast({
                type: "warning",
                title: "Incomplete Information",
                message: `Please provide: ${missing.join(', ')}`,
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
            {saving ? <Loader label="Finalizing registration" message="Securely setting up your health profile..." fullscreen /> : null}

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
                            <TextField tooltip="Your legal first name as it appears on your ID." icon={UserRound} label="First name" value={form.firstname} error={errors.firstname} placeholder="e.g. Juan" onChange={(value) => updateField("firstname", value)} />
                            <TextField tooltip="Your legal surname." icon={UserRound} label="Last name" value={form.lastname} error={errors.lastname} placeholder="e.g. Dela Cruz" onChange={(value) => updateField("lastname", value)} />
                            <SchoolEmailField
                                tooltip="Your official school email account used for logging in."
                                value={form.email}
                                error={errors.email}
                                onChange={updateSchoolEmail}
                                checkState={emailCheckState}
                            />
                            {/* The same calendar the admin form uses, so a date of
                                birth is picked the same way on both sides of the
                                system rather than through a raw native date input. */}
                            <BirthdayPicker
                                label="Birthday"
                                value={form.birthday}
                                error={errors.birthday}
                                onChange={(value) => updateField("birthday", value)}
                                badge={
                                    computedAge !== null ? (
                                        <span
                                            className="rounded-md px-2 py-0.5 text-[10px] font-bold"
                                            style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 15%, transparent)", color: "var(--color-primary)" }}
                                        >
                                            {computedAge} years old
                                        </span>
                                    ) : null
                                }
                            />
                            <SelectField tooltip="Select your biological gender for proper medical baselines." label="Gender" value={form.gender} error={errors.gender} onChange={(value) => updateField("gender", value)} options={[
                                ["", "Choose gender"],
                                ["male", "Male"],
                                ["female", "Female"],
                            ]} />
                            <SelectField
                                label="Department"
                                value={form.department}
                                error={errors.department}
                                onChange={(value) => updateField("department", value)}
                                options={[
                                    ["", "Choose department"],
                                    ...departmentOptions.map((department) => [department, getDepartmentLabel(department, form.role)]),
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
                                tooltip="Create a secure password to protect your health records."
                                label="Password"
                                placeholder="Enter a strong password"
                                value={form.password}
                                show={showPassword}
                                error={errors.password}
                                onToggle={() => setShowPassword((current) => ! current)}
                                onChange={(value) => updateField("password", value)}
                            />
                            <PasswordField
                                tooltip="Re-type your password to ensure there are no typos."
                                label="Confirm password"
                                placeholder="Re-enter your password to confirm"
                                value={form.password_confirmation}
                                show={showConfirmPassword}
                                error={errors.password_confirmation}
                                validationState={
                                    form.password_confirmation.length > 0
                                        ? form.password === form.password_confirmation
                                            ? "match"
                                            : "mismatch"
                                        : null
                                }
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
                                    if (getMissingFieldsMessage().length === 0) {
                                        submitRegistration();
                                    } else {
                                        goNext();
                                    }
                                }}
                                className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 font-black shadow-[0_20px_55px_rgba(15,118,110,0.22)] transition hover:-translate-y-0.5"
                                style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-content)" }}
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
                        className="flex items-center gap-2 rounded-xl px-5 py-3 font-bold transition hover:-translate-y-0.5 disabled:opacity-60"
                        style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-content)" }}
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

function TextField({ label, rightLabel, value, onChange, error, type = "text", icon: Icon, max, placeholder, tooltip }) {
    return (
        <label className="block text-left">
            <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-black auth-strong-text flex items-center">
                    {label}
                    {tooltip && <Tooltip text={tooltip} />}
                </span>
                {rightLabel && <span className="text-xs font-black" style={{ color: "var(--color-primary)" }}>{rightLabel}</span>}
            </div>
            <div className="mt-2 relative flex h-[3.25rem] items-center gap-3 rounded-xl border px-4 auth-control" style={{ borderColor: error ? "var(--color-error)" : undefined }}>
                {Icon ? <Icon size={18} style={{ color: "var(--color-muted)" }} /> : null}
                <input
                    type={type}
                    value={value}
                    max={max}
                    placeholder={placeholder}
                    onChange={(event) => onChange(event.target.value)}
                    className={`w-full bg-transparent text-sm font-semibold outline-none ${
                        type === "date" ? "[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer" : ""
                    } ${type === "date" && !value ? "text-muted-foreground" : ""}`}
                />
            </div>
            {error ? <span className="mt-1 block text-xs" style={{ color: "var(--color-error)" }}>{error[0]}</span> : null}
        </label>
    );
}

function SchoolEmailField({ value, onChange, error, checkState, tooltip }) {
    const [atTypedNotice, setAtTypedNotice] = useState(false);
    const containerRef = useRef(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setContainerSize({
                    width: entry.target.clientWidth,
                    height: entry.target.clientHeight
                });
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const localPart = value.endsWith(schoolEmailDomain)
        ? value.slice(0, -schoolEmailDomain.length)
        : value;
    const previewEmail = `${localPart}${schoolEmailDomain}`;

    const handleInputChange = (e) => {
        const raw = e.target.value;
        if (raw.includes("@")) {
            setAtTypedNotice(true);
            setTimeout(() => setAtTypedNotice(false), 4000);
        }
        onChange(raw);
    };

    const isError = checkState?.status === "error";
    const isSuccess = checkState?.status === "success";
    const hasAnimation = isSuccess || isError;
    const activeColor = isSuccess ? "#38BDF8" : isError ? "var(--color-error)" : "var(--auth-border)";

    const { width: w, height: h } = containerSize;
    const p = 2; // Offset to perfectly fit 4px stroke inside overflow-hidden bounds
    const r = 12; // Matching the rounded-xl 12px border radius

    // Perfect rectangular paths tracking exactly along the border
    const rightPath = w > 0 ? `M ${w/2} ${p} L ${w - r} ${p} Q ${w - p} ${p} ${w - p} ${r} L ${w - p} ${h - r} Q ${w - p} ${h - p} ${w - r} ${h - p} L ${r} ${h - p} Q ${p} ${h - p} ${p} ${h - r} L ${p} ${r} Q ${p} ${p} ${r} ${p} L ${w/2} ${p}` : "";
    const leftPath = w > 0 ? `M ${w/2} ${p} L ${r} ${p} Q ${p} ${p} ${p} ${r} L ${p} ${h - r} Q ${p} ${h - p} ${r} ${h - p} L ${w - r} ${h - p} Q ${w - p} ${h - p} ${w - p} ${h - r} L ${w - p} ${r} Q ${w - p} ${p} ${w - r} ${p} L ${w/2} ${p}` : "";

    return (
        <label className="block text-left md:col-span-2">
            <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-black auth-strong-text flex items-center">
                    School Email
                    {tooltip && <Tooltip text={tooltip} />}
                </span>
                <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--color-primary)" }}>
                    <Info size={13} /> Username only (Domain added automatically)
                </span>
            </div>

            <div
                ref={containerRef}
                className="group relative mt-2 flex h-[3.25rem] w-full flex-wrap items-center gap-3 rounded-xl border px-4 py-2 auth-control sm:flex-nowrap overflow-hidden"
                style={{ 
                    borderColor: hasAnimation ? "transparent" : error ? "var(--color-error)" : "var(--auth-border)",
                    backgroundColor: hasAnimation ? `color-mix(in srgb, ${activeColor}, transparent 92%)` : "var(--auth-panel)",
                    boxShadow: hasAnimation ? `0 12px 40px color-mix(in srgb, ${activeColor}, transparent 75%), 0 0 20px color-mix(in srgb, ${activeColor}, transparent 85%)` : "none",
                }}
            >
                <AnimatePresence>
                    {hasAnimation && w > 0 && (
                        <svg className="absolute inset-0 h-full w-full pointer-events-none z-20 overflow-visible" viewBox={`0 0 ${w} ${h}`}>
                            <motion.path
                                d={rightPath}
                                fill="none"
                                stroke={activeColor}
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ filter: `drop-shadow(0 0 8px ${activeColor}) drop-shadow(0 0 16px color-mix(in srgb, ${activeColor}, transparent 40%))` }}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                exit={{ opacity: 0, transition: { duration: 0.3 } }}
                                transition={{ duration: 4.5, ease: [0.16, 1, 0.3, 1] }}
                            />
                            <motion.path
                                d={leftPath}
                                fill="none"
                                stroke={activeColor}
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ filter: `drop-shadow(0 0 8px ${activeColor}) drop-shadow(0 0 16px color-mix(in srgb, ${activeColor}, transparent 40%))` }}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                exit={{ opacity: 0, transition: { duration: 0.3 } }}
                                transition={{ duration: 4.5, ease: [0.16, 1, 0.3, 1] }}
                            />
                        </svg>
                    )}
                </AnimatePresence>
                <Mail size={18} style={{ color: "var(--color-muted)" }} />
                <input
                    type="text"
                    value={localPart}
                    onChange={handleInputChange}
                    placeholder="firstname.lastname"
                    className="min-w-[12rem] flex-1 bg-transparent text-sm font-semibold outline-none"
                    autoComplete="username"
                />
                <span
                    className="shrink-0 rounded-lg border px-3 py-1.5 text-[0.75rem] font-black shadow-sm flex items-center gap-1"
                    style={{
                        backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, var(--auth-panel))",
                        borderColor: "color-mix(in srgb, var(--color-primary) 30%, transparent)",
                        color: "var(--color-primary)",
                    }}
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
                        className="mt-2 rounded-lg border px-3 py-1.5 text-xs font-semibold flex items-center gap-2"
                        style={{
                            backgroundColor: "color-mix(in srgb, var(--color-primary) 15%, var(--auth-panel))",
                            borderColor: "var(--color-primary)",
                            color: "var(--color-primary)",
                        }}
                    >
                        <Info size={14} className="shrink-0" />
                        <span>No need to type <strong>@</strong> — <strong>{schoolEmailDomain}</strong> is attached automatically on the right!</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {error ? (
                <span className="mt-1 block text-xs" style={{ color: "var(--color-error)" }}>
                    {error[0]}
                </span>
            ) : localPart ? (
                <span className="mt-2 block text-xs leading-5" style={{ color: "var(--color-muted)" }}>
                    Full email address:{" "}
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
            ) : (
                <span className="mt-1.5 block text-[0.78rem] leading-4" style={{ color: "var(--color-muted)" }}>
                                    Type your username only (e.g., <strong>juan.delacruz</strong>). The <strong>{schoolEmailDomain}</strong> domain is included automatically.
                </span>
            )}
        </label>
    );
}



function PasswordField({ label, placeholder, value, show, onToggle, onChange, onBlur, error, validationState }) {
    const containerRef = useRef(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setContainerSize({
                    width: entry.target.clientWidth,
                    height: entry.target.clientHeight
                });
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const { width: w, height: h } = containerSize;
    const p = 2.5; 
    const r = 12; 

    const rightPath = w > 0 ? `M ${w/2} ${p} L ${w - r} ${p} Q ${w - p} ${p} ${w - p} ${r} L ${w - p} ${h - r} Q ${w - p} ${h - p} ${w - r} ${h - p} L ${r} ${h - p} Q ${p} ${h - p} ${p} ${h - r} L ${p} ${r} Q ${p} ${p} ${r} ${p} L ${w/2} ${p}` : "";
    const leftPath = w > 0 ? `M ${w/2} ${p} L ${r} ${p} Q ${p} ${p} ${p} ${r} L ${p} ${h - r} Q ${p} ${h - p} ${r} ${h - p} L ${w - r} ${h - p} Q ${w - p} ${h - p} ${w - p} ${h - r} L ${w - p} ${r} Q ${w - p} ${p} ${w - r} ${p} L ${w/2} ${p}` : "";
    
    const isMatched = validationState === "match";
    const isMismatch = validationState === "mismatch";
    const hasAnimation = isMatched || isMismatch;
    const activeColor = isMatched ? "#38BDF8" : "var(--color-error)";

    return (
        <label className="block text-left">
            <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-black auth-strong-text">{label}</span>
                <AnimatePresence mode="wait">
                    {isMatched ? (
                        <motion.span 
                            key="match"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="text-xs font-black flex items-center gap-1" 
                            style={{ color: activeColor }}
                        >
                            <Check size={14} /> Passwords match!
                        </motion.span>
                    ) : isMismatch ? (
                        <motion.span 
                            key="mismatch"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="text-xs font-black flex items-center gap-1" 
                            style={{ color: activeColor }}
                        >
                            Passwords do not match
                        </motion.span>
                    ) : null}
                </AnimatePresence>
            </div>
            <div 
                ref={containerRef}
                className="mt-2 relative flex h-[3.25rem] items-center gap-3 rounded-xl border px-4 auth-control overflow-hidden" 
                style={{ 
                    borderColor: hasAnimation ? "transparent" : error ? "var(--color-error)" : undefined,
                    backgroundColor: hasAnimation ? `color-mix(in srgb, ${activeColor}, transparent 92%)` : "transparent",
                    boxShadow: hasAnimation ? `0 12px 40px color-mix(in srgb, ${activeColor}, transparent 75%), 0 0 20px color-mix(in srgb, ${activeColor}, transparent 85%)` : "none",
                }}
            >
                <AnimatePresence mode="wait">
                    {hasAnimation && w > 0 && (
                        <svg key={activeColor} className="absolute inset-0 h-full w-full pointer-events-none z-20 overflow-visible" viewBox={`0 0 ${w} ${h}`}>
                            <motion.path
                                d={rightPath}
                                fill="none"
                                stroke={activeColor}
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ filter: `drop-shadow(0 0 8px ${activeColor}) drop-shadow(0 0 16px color-mix(in srgb, ${activeColor}, transparent 40%))` }}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                exit={{ opacity: 0, transition: { duration: 0.3 } }}
                                transition={{ duration: 4.5, ease: [0.16, 1, 0.3, 1] }}
                            />
                            <motion.path
                                d={leftPath}
                                fill="none"
                                stroke={activeColor}
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ filter: `drop-shadow(0 0 8px ${activeColor}) drop-shadow(0 0 16px color-mix(in srgb, ${activeColor}, transparent 40%))` }}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                exit={{ opacity: 0, transition: { duration: 0.3 } }}
                                transition={{ duration: 4.5, ease: [0.16, 1, 0.3, 1] }}
                            />
                        </svg>
                    )}
                </AnimatePresence>
                
                <Lock size={18} className="z-30" style={{ color: hasAnimation ? activeColor : "var(--color-muted)" }} />
                <input
                    type={show ? "text" : "password"}
                    value={value}
                    placeholder={placeholder || `Enter your ${label.toLowerCase()}`}
                    onChange={(event) => onChange(event.target.value)}
                    onBlur={onBlur}
                    className="w-full bg-transparent text-sm font-semibold outline-none placeholder:opacity-50 z-30 relative"
                />
                <button type="button" onClick={onToggle} className="rounded-lg p-1 transition hover:scale-105 z-30" style={{ color: "var(--color-muted)" }}>
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
            {error && !hasAnimation ? <span className="mt-1 block text-xs" style={{ color: "var(--color-error)" }}>{error[0]}</span> : null}
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
