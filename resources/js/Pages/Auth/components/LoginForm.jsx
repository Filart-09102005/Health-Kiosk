import { Eye, EyeOff, Lock, Mail } from "lucide-react";

export default function LoginForm({
    form,
    errors,
    showPassword,
    onTogglePassword,
    onChange,
    onSubmit,
    onForgotPassword,
    loading,
}) {
    return (
        <form onSubmit={onSubmit} className="mt-7 space-y-5">
            <label className="block text-left">
                <span className="text-sm font-black auth-strong-text">School Email</span>
                <div
                    className="mt-2 flex min-h-14 items-center gap-3 rounded-xl border px-5 auth-control"
                >
                    <Mail size={18} style={{ color: "var(--color-muted)" }} />
                    <input
                        type="email"
                        value={form.email}
                        onChange={(event) => onChange("email", event.target.value)}
                        placeholder="yourname@smcbi.edu.ph"
                        className="w-full bg-transparent text-base font-semibold outline-none"
                        autoComplete="email"
                    />
                </div>
                {errors.email ? <span className="mt-1 block text-xs" style={{ color: "var(--color-error)" }}>{errors.email[0]}</span> : null}
            </label>

            <label className="block text-left">
                <span className="text-sm font-black auth-strong-text">Password</span>
                <div
                    className="mt-2 flex min-h-14 items-center gap-3 rounded-xl border px-5 auth-control"
                >
                    <Lock size={18} style={{ color: "var(--color-muted)" }} />
                    <input
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(event) => onChange("password", event.target.value)}
                        placeholder="Enter your password"
                        className="w-full bg-transparent text-base font-semibold outline-none"
                        autoComplete="current-password"
                    />
                    <button
                        type="button"
                        onClick={onTogglePassword}
                        className="rounded-lg p-1 transition hover:scale-105"
                        style={{ color: "var(--color-muted)" }}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                {errors.password ? <span className="mt-1 block text-xs" style={{ color: "var(--color-error)" }}>{errors.password[0]}</span> : null}
            </label>

            <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-3 text-sm font-semibold auth-muted-text">
                    <input
                        type="checkbox"
                        checked={form.remember}
                        onChange={(event) => onChange("remember", event.target.checked)}
                        className="h-4 w-4"
                        style={{ accentColor: "var(--color-primary)" }}
                    />
                    Remember me
                </label>
                <button type="button" onClick={onForgotPassword} className="text-sm font-black" style={{ color: "var(--color-primary)" }}>
                    Forgot password?
                </button>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="mt-3 w-full rounded-xl px-5 py-4 text-base font-black text-white shadow-[0_20px_55px_rgba(15,118,110,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                style={{ backgroundColor: "var(--color-primary)" }}
            >
                {loading ? "Signing in..." : "Sign in"}
            </button>
        </form>
    );
}
