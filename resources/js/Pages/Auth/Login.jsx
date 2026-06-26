import { useState } from "react";
import { Mail, ScanBarcode } from "lucide-react";
import AuthLayout from "./components/AuthLayout";
import LoginForm from "./components/LoginForm";
import BarcodeLoginForm from "./components/BarcodeLoginForm";
import Loader from "../Global/Loader";
import { useToast } from "../Global/Toast";
import { authService, getErrorMessage, getValidationErrors } from "./services/authService";
import AssistantToggle from "../User/AI-Assistant/components/AssistantToggle";
import AssistantStatusBadge from "../User/AI-Assistant/components/AssistantStatusBadge";
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
        setLoading(true);
        setErrors({});

        try {
            const response = await authService.login(form);
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

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3 auth-panel">
                <div>
                    <p className="text-sm font-black auth-strong-text">Assistant Mode</p>
                    <p className="mt-1 text-xs font-semibold auth-muted-text">Free local browser voice guidance</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <AssistantToggle />
                    <AssistantStatusBadge />
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
                />
            )}

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
        </AuthLayout>
    );
}
