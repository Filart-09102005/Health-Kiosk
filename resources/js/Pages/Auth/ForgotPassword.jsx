import { useState } from "react";
import { Mail } from "lucide-react";
import AuthLayout from "./components/AuthLayout";
import Loader from "../Global/Loader";
import { useToast } from "../Global/Toast";
import { authService, getErrorMessage, getValidationErrors } from "./services/authService";

export default function ForgotPassword({ navigate }) {
    const { showToast } = useToast();
    const [email, setEmail] = useState("");
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
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
                <label className="block text-left">
                    <span className="text-sm font-black auth-strong-text">School Email</span>
                    <div className="mt-2 flex min-h-14 items-center gap-3 rounded-xl border px-5 auth-control">
                        <Mail size={18} style={{ color: "var(--auth-muted)" }} />
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="yourname@smcbi.edu.ph"
                            className="w-full bg-transparent text-base font-semibold outline-none"
                            autoComplete="email"
                        />
                    </div>
                    {errors.email ? <span className="mt-1 block text-xs" style={{ color: "var(--color-error)" }}>{errors.email[0]}</span> : null}
                </label>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl px-5 py-4 text-base font-black text-white shadow-[0_20px_55px_rgba(15,118,110,0.28)] transition hover:-translate-y-0.5 disabled:opacity-70"
                    style={{ backgroundColor: "var(--color-primary)" }}
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
