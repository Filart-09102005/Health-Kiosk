import { useMemo, useState } from "react";
import { Check, Eye, EyeOff, Lock } from "lucide-react";
import AuthLayout from "./components/AuthLayout";
import Loader from "../Global/Loader";
import { useToast } from "../Global/Toast";
import { authService, getErrorMessage, getValidationErrors } from "./services/authService";

export default function ResetPassword({ navigate }) {
    const params = new URLSearchParams(window.location.search);
    const { showToast } = useToast();
    const [form, setForm] = useState({
        token: params.get("token") || "",
        email: params.get("email") || "",
        password: "",
        password_confirmation: "",
    });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const passwordRules = useMemo(
        () => [
            { label: "Minimum 8 characters", valid: form.password.length >= 8 },
            { label: "Uppercase and lowercase", valid: /[A-Z]/.test(form.password) && /[a-z]/.test(form.password) },
            { label: "At least 1 number", valid: /\d/.test(form.password) },
            { label: "At least 1 special character", valid: /[^A-Za-z0-9]/.test(form.password) },
            { label: "Passwords match", valid: form.password && form.password === form.password_confirmation },
        ],
        [form.password, form.password_confirmation],
    );

    const updateField = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: undefined }));
    };

    const submit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const response = await authService.resetPassword(form);
            showToast({
                type: "success",
                title: "Password reset",
                message: response.data.message,
            });
            navigate("/login");
        } catch (error) {
            setErrors(getValidationErrors(error));
            showToast({
                type: "error",
                title: "Reset failed",
                message: getErrorMessage(error),
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            eyebrow="Account Recovery"
            title="Reset password"
            subtitle="Create a new secure password for your account"
            panelTitle="Secure your Health Kiosk account"
            panelDescription="Use the reset link from your school email and choose a strong new password."
            variant="login"
        >
            {loading ? <Loader label="Resetting password" fullscreen /> : null}

            <form onSubmit={submit} className="mt-8 space-y-5">
                <PasswordInput
                    label="New password"
                    value={form.password}
                    show={showPassword}
                    error={errors.password}
                    onToggle={() => setShowPassword((current) => ! current)}
                    onChange={(value) => updateField("password", value)}
                />
                <PasswordInput
                    label="Confirm password"
                    value={form.password_confirmation}
                    show={showConfirmPassword}
                    error={errors.password_confirmation}
                    onToggle={() => setShowConfirmPassword((current) => ! current)}
                    onChange={(value) => updateField("password_confirmation", value)}
                />

                <div className="rounded-xl border p-5 auth-panel">
                    <div className="grid gap-2">
                        {passwordRules.map((rule) => (
                            <div key={rule.label} className="flex items-center gap-2 text-sm font-semibold" style={{ color: rule.valid ? "var(--color-success)" : "var(--auth-muted)" }}>
                                <Check size={15} />
                                {rule.label}
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading || !form.token || !form.email}
                    className="w-full rounded-xl px-5 py-4 text-base font-black text-white shadow-[0_20px_55px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 disabled:opacity-70"
                    style={{ backgroundColor: "var(--color-primary)" }}
                >
                    Reset password
                </button>
            </form>
        </AuthLayout>
    );
}

function PasswordInput({ label, value, show, error, onToggle, onChange }) {
    return (
        <label className="block text-left">
            <span className="text-sm font-black auth-strong-text">{label}</span>
            <div className="mt-2 flex min-h-14 items-center gap-3 rounded-xl border px-5 auth-control">
                <Lock size={18} style={{ color: "var(--auth-muted)" }} />
                <input
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="w-full bg-transparent text-base font-semibold outline-none"
                    autoComplete="new-password"
                />
                <button type="button" onClick={onToggle} className="rounded-lg p-1 transition hover:scale-105" style={{ color: "var(--auth-muted)" }}>
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
            {error ? <span className="mt-1 block text-xs" style={{ color: "var(--color-error)" }}>{error[0]}</span> : null}
        </label>
    );
}
