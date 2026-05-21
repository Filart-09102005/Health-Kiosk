import { useEffect, useState } from "react";
import { CheckCircle2, MailCheck } from "lucide-react";
import ThemeToggle from "../Global/ThemeToggle";
import Loader from "../Global/Loader";
import { useToast } from "../Global/Toast";
import { authService, getErrorMessage } from "./services/authService";

export default function VerifyEmail({ navigate }) {
    const { showToast } = useToast();
    const params = new URLSearchParams(window.location.search);
    const verified = params.get("verified") === "1";
    const sent = params.get("sent") === "1";
    const [email, setEmail] = useState(params.get("email") || "");
    const [resending, setResending] = useState(false);

    useEffect(() => {
        if (! verified) {
            return undefined;
        }

        const timer = window.setTimeout(() => navigate("/login"), 3500);
        return () => window.clearTimeout(timer);
    }, [navigate, verified]);

    const resend = async (event) => {
        event.preventDefault();
        setResending(true);

        try {
            const response = await authService.resendVerification(email);
            showToast({
                type: "info",
                title: "Verification email",
                message: response.data.message,
            });
        } catch (error) {
            showToast({
                type: "error",
                title: "Unable to resend",
                message: getErrorMessage(error),
            });
        } finally {
            setResending(false);
        }
    };

    return (
        <main className="min-h-screen px-4 py-6" style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
            {resending ? <Loader label="Sending verification" fullscreen /> : null}

            <div className="mx-auto flex max-w-4xl justify-end">
                <ThemeToggle />
            </div>

            <section className="mx-auto mt-10 max-w-4xl rounded-[2rem] border p-8 text-center shadow-2xl md:p-12" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] text-white" style={{ backgroundColor: verified ? "var(--color-success)" : "var(--color-primary)" }}>
                    {verified ? <CheckCircle2 size={38} /> : <MailCheck size={38} />}
                </div>

                <p className="mt-8 text-sm font-black uppercase tracking-[0.2em]" style={{ color: "var(--color-primary)" }}>
                    Health Kiosk Verification
                </p>
                <h1 className="mt-3 text-4xl font-black">
                    {verified ? "Email verified successfully" : "Check your email"}
                </h1>
                <p className="mx-auto mt-4 max-w-2xl leading-7" style={{ color: "var(--color-muted)" }}>
                    {verified
                        ? "Your account is active. You will be redirected to login in a few seconds."
                        : sent
                          ? "We queued your verification email. Open the link in your inbox before logging in."
                          : "Use the verification link sent to your email address to activate your account."}
                </p>

                <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate("/login")}
                        className="rounded-2xl px-5 py-3 font-bold text-white transition hover:-translate-y-0.5"
                        style={{ backgroundColor: "var(--color-primary)" }}
                    >
                        Go to Login
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/register")}
                        className="rounded-2xl border px-5 py-3 font-bold transition hover:-translate-y-0.5"
                        style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}
                    >
                        Register Another Account
                    </button>
                </div>

                {! verified ? (
                    <form onSubmit={resend} className="mx-auto mt-8 flex max-w-xl flex-col gap-3 rounded-3xl border p-4 md:flex-row" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="Email address"
                            className="min-w-0 flex-1 rounded-2xl border px-4 py-3 text-sm outline-none"
                            style={{
                                backgroundColor: "var(--color-card)",
                                borderColor: "var(--color-border)",
                                color: "var(--color-text)",
                            }}
                        />
                        <button
                            type="submit"
                            className="rounded-2xl px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5"
                            style={{ backgroundColor: "var(--color-success)" }}
                        >
                            Resend Link
                        </button>
                    </form>
                ) : null}
            </section>
        </main>
    );
}
