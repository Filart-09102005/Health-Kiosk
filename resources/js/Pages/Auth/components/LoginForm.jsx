import { useState } from "react";
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
    onModeChange,
}) {
    const schoolEmailDomain = "@smcbi.edu.ph";
    const usesSchoolEmail = !form.email.includes("@") || form.email.endsWith(schoolEmailDomain);
    const [emailMode, setEmailMode] = useState(usesSchoolEmail ? "school" : "full");

    const localPart = form.email?.endsWith(schoolEmailDomain)
        ? form.email.slice(0, -schoolEmailDomain.length)
        : form.email;

    /**
     * Switching the field also switches which accounts may sign in.
     *
     * "school" is the student sign-in and "full" the admin one, so the parent is
     * told as well: the server refuses an account whose role does not match.
     */
    const switchEmailMode = (mode) => {
        setEmailMode(mode);
        onChange("email", "");
        onModeChange?.(mode);
    };

    const handleSchoolEmailChange = (e) => {
        const raw = e.target.value.toLowerCase().replace(schoolEmailDomain, "").replace(/[^a-z0-9._-]/g, "");
        onChange("email", raw ? `${raw}${schoolEmailDomain}` : "");
    };

    const handleFullEmailChange = (e) => {
        onChange("email", e.target.value.toLowerCase().trim().replace(/[^a-z0-9@._-]/g, ""));
    };

    return (
        <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-2">
            <div className="block text-left">
                <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-black auth-strong-text">
                        {emailMode === "school" ? "School Email" : "Admin Email"}
                    </span>
                    <button
                        type="button"
                        onClick={() => switchEmailMode(emailMode === "school" ? "full" : "school")}
                        className="rounded-lg border px-3 py-1.5 text-xs font-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        style={{
                            backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, var(--auth-panel))",
                            borderColor: "color-mix(in srgb, var(--color-primary) 30%, transparent)",
                            color: "var(--color-primary)",
                        }}
                    >
                        {emailMode === "school" ? "Admin login" : "Student login"}
                    </button>
                </div>

                {emailMode === "school" ? (
                    <label
                        className="mt-2 flex h-[3.25rem] w-full flex-wrap items-center gap-3 rounded-xl border px-4 py-2 auth-control sm:flex-nowrap overflow-hidden"
                    >
                        <Mail size={18} style={{ color: "var(--color-muted)" }} className="shrink-0" />
                        <input
                            type="text"
                            value={localPart}
                            onChange={handleSchoolEmailChange}
                            placeholder="firstname.lastname"
                            className="min-w-[12rem] flex-1 bg-transparent text-base font-semibold outline-none"
                            autoComplete="username"
                        />
                        <span
                            className="shrink-0 text-sm font-semibold flex items-center"
                            style={{ color: "var(--color-muted)" }}
                        >
                            {schoolEmailDomain}
                        </span>
                    </label>
                ) : (
                    <label className="mt-2 flex h-[3.25rem] w-full items-center gap-3 rounded-xl border px-4 auth-control">
                        <Mail size={18} style={{ color: "var(--color-muted)" }} className="shrink-0" />
                        <input
                            type="email"
                            value={form.email}
                            onChange={handleFullEmailChange}
                            placeholder="Enter admin email"
                            className="w-full bg-transparent text-base font-semibold outline-none"
                            autoComplete="username"
                        />
                    </label>
                )}

                <div className="mt-1.5 min-h-[28px] flex flex-col justify-start">
                    {errors.email ? (
                        <span className="block text-xs" style={{ color: "var(--color-error)" }}>{errors.email[0]}</span>
                    ) : emailMode === "school" && localPart ? (
                        <span className="block text-xs leading-5 flex items-center gap-1" style={{ color: "var(--color-muted)" }}>
                            Full email address:{" "}
                            <span
                                className="rounded-lg px-2 py-0.5 font-black"
                                style={{
                                    backgroundColor: "color-mix(in srgb, var(--color-primary), transparent 86%)",
                                    color: "var(--color-primary)",
                                }}
                            >
                                {form.email}
                            </span>
                        </span>
                    ) : null}
                </div>
            </div>

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
                
                <div className="mt-1.5 min-h-[20px]">
                    {errors.password ? <span className="block text-xs" style={{ color: "var(--color-error)" }}>{errors.password[0]}</span> : null}
                </div>
            </label>

            <div className="flex items-center justify-between gap-3 mt-1">
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
                className="mt-3 w-full rounded-xl px-5 py-4 text-base font-black shadow-[0_20px_55px_rgba(15,118,110,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-content)" }}
            >
                {loading ? "Signing in..." : "Sign in"}
            </button>
        </form>
    );
}
