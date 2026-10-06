import { useState, useEffect, useRef, useCallback } from "react";
import { Mail, ScanBarcode, X, CheckCircle, XCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AuthLayout from "./components/AuthLayout";
import Tooltip from "../Global/Tooltip";
import LoginForm from "./components/LoginForm";
import BarcodeLoginForm from "./components/BarcodeLoginForm";
import Loader from "../Global/Loader";
import { useToast } from "../Global/Toast";
import { authService, getErrorMessage, getValidationErrors } from "./services/authService";
import AssistantToggle from "../User/AI-Assistant/components/AssistantToggle";
import { useAssistant } from "../User/AI-Assistant/context/AssistantProvider";

export default function Login({ navigate }) {
    const { showToast } = useToast();
    const { speak } = useAssistant();
    const [form, setForm] = useState({
        email: "",
        password: "",
        remember: false,
    });
    const [errors, setErrors] = useState({});
    const [barcodeErrors, setBarcodeErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loginMode, setLoginMode] = useState("barcode");
    // Which sign-in is in use, driven by the Admin login / Student login button
    // inside LoginForm. Sent with the credentials so the server can refuse an
    // account whose role does not match the chosen sign-in.
    const [loginAs, setLoginAs] = useState("student");
    // Resend Email Modal State
    const [showResendModal, setShowResendModal] = useState(false);
    const [resendEmail, setResendEmail] = useState("");
    const [resendCheckState, setResendCheckState] = useState(null);
    const [sendingResend, setSendingResend] = useState(false);
    const checkTimeoutRef = useRef(null);

    const handleResendEmailChange = (fullEmail) => {
        setResendEmail(fullEmail);
        setResendCheckState(null);

        if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);

        if (fullEmail && fullEmail.includes("@")) {
            checkTimeoutRef.current = setTimeout(async () => {
                try {
                    const response = await authService.checkEmail(fullEmail);
                    if (response.data.available) {
                        setResendCheckState({ status: "not_found" });
                    } else if (response.data.verified) {
                        setResendCheckState({ status: "verified", verifiedAt: response.data.verified_at });
                    } else {
                        setResendCheckState({ status: "unverified" });
                    }
                } catch (error) {
                    console.error("Check email failed", error);
                }
            }, 600);
        }
    };

    const updateField = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: undefined }));
    };

    const handleLoginSuccess = (response) => {
        showToast({
            type: "success",
            title: "Welcome back",
            message: response.data.message,
        });
        navigate(response.data.redirect);
    };

    const changeLoginMode = (mode) => {
        setLoginMode(mode);
        speak(mode === "barcode" ? "loginBarcode" : "loginEmail");
    };

    const submit = async (event) => {
        event.preventDefault();

        // The button is disabled while loading, but that only takes effect on the
        // next render. A held Enter key or a double-click can dispatch twice
        // before then, which would open two kiosk sessions for one sign-in.
        if (loading) return;
        
        // Client-side validation to prevent loading screen when empty
        if (!form.email.trim() || !form.password.trim()) {
            const newErrors = {};
            let errorMessage = "";

            if (!form.email.trim() && !form.password.trim()) {
                newErrors.email = ["The email field is required."];
                newErrors.password = ["The password field is required."];
                errorMessage = "Both email and password fields are required.";
            } else if (!form.email.trim()) {
                newErrors.email = ["The email field is required."];
                errorMessage = "The email field is required.";
            } else if (!form.password.trim()) {
                newErrors.password = ["The password field is required."];
                errorMessage = "The password field is required.";
            }

            setErrors(newErrors);
            showToast({
                type: "error",
                title: "Login failed",
                message: errorMessage,
            });
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            const response = await authService.login({ ...form, login_as: loginAs });

            handleLoginSuccess(response);
        } catch (error) {
            setErrors(getValidationErrors(error));
            showToast({
                type: error?.response?.status === 403 ? "warning" : "error",
                title: "Login failed",
                message: getErrorMessage(error),
            });
        } finally {
            setLoading(false);
        }
    };

    const submitBarcode = async (barcode) => {
        if (loading) return;

        setLoading(true);
        setBarcodeErrors({});

        try {
            const response = await authService.barcodeLogin({ barcode });
            handleLoginSuccess(response);
        } catch (error) {
            setBarcodeErrors(getValidationErrors(error));
            showToast({
                type: error?.response?.status === 403 ? "warning" : "error",
                title: "Barcode login failed",
                message: getErrorMessage(error),
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async (e) => {
        e.preventDefault();
        if (!resendEmail.trim()) {
            showToast({ type: "error", title: "Missing Email", message: "Please enter your school email." });
            return;
        }

        if (resendCheckState?.status === "not_found") {
            showToast({ type: "warning", title: "Not Found", message: "That email is not registered in our system." });
            return;
        }

        if (resendCheckState?.status === "verified") {
            showToast({ type: "info", title: "Already Verified", message: "That email is already verified. Please sign in." });
            return;
        }

        setSendingResend(true);
        try {
            const response = await authService.resendVerification(resendEmail);
            showToast({ type: "success", title: "Verification Sent", message: response.data.message });
            setShowResendModal(false);
            setResendEmail("");
        } catch (error) {
            showToast({ type: "error", title: "Resend Failed", message: getErrorMessage(error) });
        } finally {
            setSendingResend(false);
        }
    };

    return (
        <AuthLayout
            eyebrow="Welcome Back"
            title="Sign in"
            subtitle="Use your school barcode or email credentials"
            panelTitle="Scan your School ID to get started"
            panelDescription="Securely authenticate with your school barcode or sign in with your school email address."
            variant="login"
        >
            {loading ? <Loader label="Signing you in" message="Verifying your account and opening your secure kiosk session." fullscreen /> : null}

            <div className="mt-6 flex flex-col gap-3">
                    {/* Assistant Mode Panel */}
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3 auth-panel">
                        <div>
                            <p className="text-sm font-black auth-strong-text flex items-center">
                                Assistant Mode
                                <Tooltip text="Enable the voice assistant to guide you through the kiosk interface." />
                            </p>
                            <p className="mt-1 text-xs font-semibold auth-muted-text">Free local browser voice guidance</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <AssistantToggle />
                        </div>
                    </div>

                    {/* Email Verification Panel */}
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3 auth-panel">
                        <div>
                            <p className="text-sm font-black auth-strong-text flex items-center">
                                Email Verification
                                <Tooltip text="If you didn't receive your registration email, request a new link here." />
                            </p>
                            <p className="mt-1 text-xs font-semibold auth-muted-text">Missed your verification link?</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                type="button" 
                                onClick={() => setShowResendModal(true)} 
                                className="text-xs font-black uppercase tracking-wide transition hover:-translate-y-0.5 rounded-lg px-4 py-2 shadow-sm" 
                                style={{ backgroundColor: "var(--color-primary)", color: "white" }}
                            >
                                Resend Link
                            </button>
                        </div>
                    </div>
            </div>

            <div className="mt-8 grid grid-cols-2 rounded-xl border p-1 auth-panel">
                <button
                    type="button"
                    onClick={() => changeLoginMode("barcode")}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-black transition"
                    style={{
                        backgroundColor: loginMode === "barcode" ? "var(--auth-control)" : "transparent",
                        color: loginMode === "barcode" ? "var(--auth-text)" : "var(--auth-muted)",
                    }}
                >
                    <ScanBarcode size={16} />
                    Barcode
                </button>
                <button
                    type="button"
                    onClick={() => changeLoginMode("email")}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-black transition"
                    style={{
                        backgroundColor: loginMode === "email" ? "var(--auth-control)" : "transparent",
                        color: loginMode === "email" ? "var(--auth-text)" : "var(--auth-muted)",
                    }}
                >
                    <Mail size={16} />
                    Email
                </button>
            </div>

            <div>
                {loginMode === "barcode" ? (
                    <BarcodeLoginForm
                        errors={barcodeErrors}
                        loading={loading}
                        onSubmit={submitBarcode}
                    />
                ) : (
                    <LoginForm
                        form={form}
                        errors={errors}
                        showPassword={showPassword}
                        onTogglePassword={() => setShowPassword((current) => ! current)}
                        onChange={updateField}
                        onSubmit={submit}
                        onForgotPassword={() => navigate("/forgot-password")}
                        loading={loading}
                        onModeChange={(mode) => setLoginAs(mode === "full" ? "admin" : "student")}
                    />
                )}
            </div>

                <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center text-sm font-semibold auth-muted-text">
                    <span className="h-px" style={{ backgroundColor: "var(--auth-border)" }} />
                    <span>New here?</span>
                    <span className="h-px" style={{ backgroundColor: "var(--auth-border)" }} />
                </div>
                <p className="mt-5 text-center text-sm font-semibold auth-strong-text">
                    Don't have an account?{" "}
                    <button type="button" onClick={() => navigate("/register")} className="font-black" style={{ color: "var(--color-primary)" }}>
                        Create one
                    </button>
                </p>

            {/* Resend Verification Modal */}
            <AnimatePresence>
                {showResendModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="relative w-full max-w-md overflow-hidden rounded-2xl border p-6 shadow-2xl auth-panel"
                            style={{ borderColor: "var(--auth-border)" }}
                        >
                            <button
                                type="button"
                                onClick={() => !sendingResend && setShowResendModal(false)}
                                className="absolute right-4 top-4 rounded-full p-1 opacity-70 transition hover:bg-gray-200 hover:opacity-100 dark:hover:bg-gray-800"
                            >
                                <X size={20} />
                            </button>

                            <h3 className="text-xl font-black auth-strong-text">Resend Verification</h3>
                            <p className="mt-2 text-sm font-semibold auth-muted-text">
                                Did you miss your email? Enter your school email below and we'll send you a new verification link.
                            </p>

                            <form onSubmit={handleResend} className="mt-6 space-y-5">
                                <ResendEmailField 
                                    value={resendEmail} 
                                    onChange={handleResendEmailChange} 
                                    checkState={resendCheckState} 
                                    disabled={sendingResend} 
                                />

                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowResendModal(false)}
                                        disabled={sendingResend}
                                        className="rounded-xl px-5 py-3 text-sm font-bold opacity-80 hover:opacity-100 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={sendingResend}
                                        className="rounded-xl px-6 py-3 text-sm font-black shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                                        style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-content)" }}
                                    >
                                        {sendingResend ? "Sending..." : "Send Link"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AuthLayout>
    );
}

function ResendEmailField({ value, onChange, checkState, disabled }) {
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

    const isVerified = checkState?.status === "verified";
    const isUnverified = checkState?.status === "unverified";
    const isNotFound = checkState?.status === "not_found";
    
    const verifiedDate = isVerified && checkState.verifiedAt 
        ? new Date(checkState.verifiedAt).toLocaleString('en-US', { 
            month: 'short', day: 'numeric', year: 'numeric', 
            hour: 'numeric', minute: '2-digit', hour12: true 
          }) 
        : null;

    const hasAnimation = checkState !== null; 
    let activeColor = "var(--auth-border)";
    if (isVerified) activeColor = "var(--color-primary)"; 
    if (isUnverified) activeColor = "var(--color-error)"; 
    if (isNotFound) activeColor = "var(--color-muted)"; 

    const { width: w, height: h } = containerSize;
    const p = 2.5; 
    const r = 12; 

    const schoolEmailDomain = "@smcbi.edu.ph";
    const localPart = value.endsWith(schoolEmailDomain)
        ? value.slice(0, -schoolEmailDomain.length)
        : value;

    const rightPath = w > 0 ? `M ${w/2} ${p} L ${w - r} ${p} Q ${w - p} ${p} ${w - p} ${r} L ${w - p} ${h - r} Q ${w - p} ${h - p} ${w - r} ${h - p} L ${r} ${h - p} Q ${p} ${h - p} ${p} ${h - r} L ${p} ${r} Q ${p} ${p} ${r} ${p} L ${w/2} ${p}` : "";
    const leftPath = w > 0 ? `M ${w/2} ${p} L ${r} ${p} Q ${p} ${p} ${p} ${r} L ${p} ${h - r} Q ${p} ${h - p} ${r} ${h - p} L ${w - r} ${h - p} Q ${w - p} ${h - p} ${w - p} ${h - r} L ${w - p} ${r} Q ${w - p} ${p} ${w - r} ${p} L ${w/2} ${p}` : "";

    return (
        <label className="block text-left">
            <span className="text-sm font-black auth-strong-text flex items-center">
                School Email
                <Tooltip text="Enter the school email you used to register." />
            </span>
            
            <div
                ref={containerRef}
                className="group relative mt-2 flex min-h-14 w-full items-center gap-3 rounded-xl border px-4 py-2 auth-control overflow-hidden flex-wrap sm:flex-nowrap"
                style={{ 
                    borderColor: hasAnimation ? "transparent" : "var(--auth-border)",
                    backgroundColor: hasAnimation ? `color-mix(in srgb, ${activeColor}, transparent 92%)` : "transparent",
                    boxShadow: hasAnimation ? `0 12px 40px color-mix(in srgb, ${activeColor}, transparent 75%), 0 0 20px color-mix(in srgb, ${activeColor}, transparent 85%)` : "none",
                }}
            >
                <AnimatePresence>
                    {hasAnimation && w > 0 && (
                        <svg className="absolute inset-0 h-full w-full pointer-events-none z-20 overflow-visible" viewBox={`0 0 ${w} ${h}`}>
                            <motion.path
                                d={rightPath} fill="none" stroke={activeColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                                style={{ filter: `drop-shadow(0 0 8px ${activeColor}) drop-shadow(0 0 16px color-mix(in srgb, ${activeColor}, transparent 40%))` }}
                                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} exit={{ opacity: 0, transition: { duration: 0.3 } }}
                                transition={{ duration: 4.5, ease: [0.16, 1, 0.3, 1] }}
                            />
                            <motion.path
                                d={leftPath} fill="none" stroke={activeColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                                style={{ filter: `drop-shadow(0 0 8px ${activeColor}) drop-shadow(0 0 16px color-mix(in srgb, ${activeColor}, transparent 40%))` }}
                                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} exit={{ opacity: 0, transition: { duration: 0.3 } }}
                                transition={{ duration: 4.5, ease: [0.16, 1, 0.3, 1] }}
                            />
                        </svg>
                    )}
                </AnimatePresence>
                <Mail size={18} style={{ color: "var(--color-muted)" }} className="relative z-30 shrink-0" />
                <input
                    type="text"
                    value={localPart}
                    onChange={(e) => {
                        const raw = e.target.value.toLowerCase().replace(schoolEmailDomain, "").replace(/[^a-z0-9._-]/g, "");
                        onChange(raw ? `${raw}${schoolEmailDomain}` : "");
                    }}
                    placeholder="firstname.lastname"
                    className="min-w-[12rem] flex-1 bg-transparent text-base font-semibold outline-none relative z-30"
                    required
                    disabled={disabled}
                    autoComplete="username"
                />
                <span
                    className="relative z-30 shrink-0 rounded-lg border px-3 py-1.5 text-[0.75rem] font-black shadow-sm flex items-center gap-1"
                    style={{
                        backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, var(--auth-panel))",
                        borderColor: "color-mix(in srgb, var(--color-primary) 30%, transparent)",
                        color: "var(--color-primary)",
                    }}
                >
                    {schoolEmailDomain}
                </span>
            </div>

            <div className="mt-2 min-h-[50px] flex flex-col justify-start">
                {localPart ? (
                    <span className="block text-xs leading-5" style={{ color: "var(--color-muted)" }}>
                        Full email address:{" "}
                        <span
                            className="rounded-lg px-2 py-1 font-black"
                            style={{
                                backgroundColor: "color-mix(in srgb, var(--color-primary), transparent 86%)",
                                color: "var(--color-primary)",
                            }}
                        >
                            {value}
                        </span>
                    </span>
                ) : (
                    <span className="block text-xs leading-5 invisible">Placeholder</span>
                )}

                <div className="h-5 relative mt-1">
                    <AnimatePresence mode="wait">
                        {isVerified && (
                            <motion.span key="verified" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1 text-[11px] font-bold" style={{ color: "var(--color-primary)" }}>
                                <CheckCircle size={14} className="shrink-0" /> 
                                <span>Verified on {verifiedDate}. You can sign in.</span>
                            </motion.span>
                        )}
                        {isUnverified && (
                            <motion.span key="unverified" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1 text-[11px] font-bold" style={{ color: "var(--color-error)" }}>
                                <Info size={14} className="shrink-0" /> Email not verified. Click send below.
                            </motion.span>
                        )}
                        {isNotFound && (
                            <motion.span key="notfound" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1 text-[11px] font-bold" style={{ color: "var(--color-muted)" }}>
                                <XCircle size={14} className="shrink-0" /> Email not found in our system.
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </label>
    );
}
