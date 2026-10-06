import { useState, useRef, useEffect } from "react";
import { Mail, CheckCircle, XCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AuthLayout from "./components/AuthLayout";
import Loader from "../Global/Loader";
import { useToast } from "../Global/Toast";
import { authService, getErrorMessage, getValidationErrors } from "./services/authService";

export default function ForgotPassword({ navigate }) {
    const { showToast } = useToast();
    const [email, setEmail] = useState("");
    const [checkState, setCheckState] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const checkTimeoutRef = useRef(null);

    const handleEmailChange = (fullEmail) => {
        setEmail(fullEmail);
        setCheckState(null);

        if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);

        if (fullEmail && fullEmail.includes("@")) {
            checkTimeoutRef.current = setTimeout(async () => {
                try {
                    const response = await authService.checkEmail(fullEmail);
                    if (response.data.available) {
                        setCheckState({ status: "not_found" }); // Email is available, meaning it's NOT registered
                    } else {
                        setCheckState({ status: "exists" }); // Email is registered, so they can reset
                    }
                } catch (error) {
                    console.error("Check email failed", error);
                }
            }, 600);
        }
    };

    const submit = async (event) => {
        event.preventDefault();

        if (checkState?.status === "not_found") {
            showToast({ type: "warning", title: "Not Found", message: "That email is not registered in our system." });
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            const response = await authService.forgotPassword(email);
            showToast({
                type: "success",
                title: "Reset link sent",
                message: response.data.message,
            });
        } catch (error) {
            setErrors(getValidationErrors(error));
            showToast({
                type: "error",
                title: "Unable to send link",
                message: getErrorMessage(error),
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            eyebrow="Account Recovery"
            title="Forgot password"
            subtitle="Enter your school email to receive a secure reset link"
            panelTitle="Recover your Health Kiosk access"
            panelDescription="A password reset link will be sent through the school email connected to your account."
            variant="login"
        >
            {loading ? <Loader label="Sending reset link" fullscreen /> : null}

            <form onSubmit={submit} className="mt-8 space-y-5">
                <RecoveryEmailField 
                    value={email}
                    onChange={handleEmailChange}
                    error={errors.email}
                    checkState={checkState}
                    disabled={loading}
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl px-5 py-4 text-base font-black shadow-[0_20px_55px_rgba(15,118,110,0.28)] transition hover:-translate-y-0.5 disabled:opacity-70"
                    style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-content)" }}
                >
                    Send reset link
                </button>
            </form>

            <div className="mt-8 text-center">
                <button type="button" onClick={() => navigate("/login")} className="font-black" style={{ color: "var(--color-primary)" }}>
                    Back to sign in
                </button>
            </div>
        </AuthLayout>
    );
}

function RecoveryEmailField({ value, onChange, error, checkState, disabled }) {
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

    const isExists = checkState?.status === "exists";
    const isNotFound = checkState?.status === "not_found";

    const hasAnimation = checkState !== null; 
    let activeColor = "var(--auth-border)";
    if (isExists) activeColor = "var(--color-primary)"; 
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
            <span className="text-sm font-black auth-strong-text">School Email</span>
            
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
                            className="rounded-lg px-2 py-0.5 font-black"
                            style={{
                                backgroundColor: "color-mix(in srgb, var(--color-primary), transparent 86%)",
                                color: "var(--color-primary)",
                            }}
                        >
                            {value}
                        </span>
                    </span>
                ) : null}

                <div className="h-5 relative mt-1">
                    {error ? (
                        <span className="block text-xs" style={{ color: "var(--color-error)" }}>{error[0]}</span>
                    ) : (
                        <AnimatePresence mode="wait">
                            {isExists && (
                                <motion.span key="exists" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1 text-[11px] font-bold" style={{ color: "var(--color-primary)" }}>
                                    <CheckCircle size={14} className="shrink-0" /> 
                                    <span>Email found. You can send a reset link.</span>
                                </motion.span>
                            )}
                            {isNotFound && (
                                <motion.span key="notfound" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1 text-[11px] font-bold" style={{ color: "var(--color-muted)" }}>
                                    <XCircle size={14} className="shrink-0" /> Email not found in our system.
                                </motion.span>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </label>
    );
}
