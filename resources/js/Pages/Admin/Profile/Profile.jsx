import { CheckCircle2, Circle, Eye, EyeOff, LockKeyhole, Mail, Save, ShieldCheck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { authService, getErrorMessage } from "../../Auth/services/authService";
import { PASSWORD_RULES } from "../../../Global/ChangePasswordModal";
import { getDisplayName, getInitials } from "../../../Global/userIdentity";
import { useToast } from "../../Global/Toast";
import AdminShell from "../components/AdminShell";

const initialProfile = {
    firstname: "",
    lastname: "",
    email: "",
    role: "Admin",
};

export default function Profile({ navigate }) {
    const { showToast } = useToast();
    const shouldReduceMotion = useReducedMotion();
    const [profile, setProfile] = useState(initialProfile);
    const [password, setPassword] = useState({ current: "", next: "", confirm: "" });
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    useEffect(() => {
        let alive = true;

        authService.currentUser()
            .then((response) => {
                const user = response.data?.user || response.data;

                if (!alive || !user) return;

                setProfile({
                    firstname: user.firstname || "",
                    lastname: user.lastname || "",
                    email: user.email || "",
                    role: user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Admin",
                });
            })
            .catch((error) => {
                if (!alive) return;

                showToast({
                    type: "error",
                    title: "Profile unavailable",
                    message: getErrorMessage(error, "Unable to load your profile right now."),
                });

                if (error?.response?.status === 401 || error?.response?.status === 403) {
                    navigate("/login");
                }
            });

        return () => {
            alive = false;
        };
    }, [navigate, showToast]);

    const updateProfile = (key, value) => {
        setProfile((current) => ({ ...current, [key]: value }));
    };

    const updatePassword = (key, value) => {
        setPassword((current) => ({ ...current, [key]: value }));
    };

    const saveProfile = () => {
        if (!profile.firstname || !profile.lastname) {
            showToast({ type: "error", title: "Validation Error", message: "Firstname and lastname are required." });
            return;
        }

        setSavingProfile(true);
        authService.updateProfile({ firstname: profile.firstname, lastname: profile.lastname })
            .then((res) => {
                showToast({ type: "success", title: "Profile Updated", message: res.data.message });
            })
            .catch((error) => {
                showToast({
                    type: "error",
                    title: "Profile update failed",
                    message: getErrorMessage(error, "Unable to save your profile."),
                });
            })
            .finally(() => {
                setSavingProfile(false);
            });
    };

    /**
     * Checked in the order the fields are filled in: current password, then the
     * new password's strength, then the confirmation. Reporting a mismatch
     * before the new password is even valid sends the admin to fix the wrong
     * field.
     */
    const savePassword = () => {
        // 1. Current password
        if (!password.current) {
            showToast({ type: "error", title: "Current password required", message: "Enter your current password to authorise the change." });
            return;
        }

        // 2. New password
        if (!password.next) {
            showToast({ type: "error", title: "New password required", message: "Enter the new password you want to use." });
            return;
        }

        const unmet = PASSWORD_RULES.filter((rule) => !rule.test(password.next));
        if (unmet.length) {
            showToast({
                type: "error",
                title: "Password not strong enough",
                message: `Still needed: ${unmet.map((rule) => rule.label.toLowerCase()).join(", ")}.`,
            });
            return;
        }

        if (password.next === password.current) {
            showToast({ type: "error", title: "Choose a different password", message: "The new password must not match your current one." });
            return;
        }

        // 3. Confirmation
        if (!password.confirm) {
            showToast({ type: "error", title: "Confirmation required", message: "Re-enter the new password to confirm it." });
            return;
        }

        if (password.next !== password.confirm) {
            showToast({ type: "error", title: "Passwords do not match", message: "The confirmation does not match the new password." });
            return;
        }

        setSavingPassword(true);
        // `next_confirmation`, not `confirm`: Laravel's `confirmed` rule looks for
        // <field>_confirmation. Sending `confirm` meant the endpoint rejected
        // every attempt with "confirmation does not match" even when the two new
        // passwords were identical - the admin password could never be changed.
        authService.updatePassword({
            current: password.current,
            next: password.next,
            next_confirmation: password.confirm,
        })
            .then((res) => {
                showToast({ type: "success", title: "Password Updated", message: res.data.message });
                setPassword({ current: "", next: "", confirm: "" });
            })
            .catch((error) => {
                showToast({
                    type: "error",
                    title: "Password update failed",
                    message: getErrorMessage(error, "Unable to update your password."),
                });
            })
            .finally(() => {
                setSavingPassword(false);
            });
    };

    return (
        <AdminShell navigate={navigate} eyebrow="Account" title="Admin Profile">
            <motion.div
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 0.24, ease: "easeOut" }}
                className="mt-6 space-y-6"
            >
                <motion.section
                    initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={shouldReduceMotion ? { duration: 0.01 } : { delay: 0.08, duration: 0.42, ease: "easeOut" }}
                    transformTemplate={(_, generated) => `${generated} translateZ(0)`}
                    className="relative transform-gpu overflow-hidden rounded-[1.5rem] border p-6 hk-admin-card"
                    style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", willChange: "transform, opacity" }}
                >
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full"
                        style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--color-primary) 13%, transparent), transparent 70%)" }}
                    />

                    <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                            <p className="text-[0.65rem] font-black uppercase tracking-[0.2em]" style={{ color: "var(--color-primary)" }}>
                                Account profile
                            </p>
                            <h2 className="mt-1.5 text-3xl font-black tracking-tight">Profile Settings</h2>
                            <p className="mt-2 max-w-2xl text-sm font-medium leading-6" style={{ color: "var(--color-muted)" }}>
                                Manage administrator information and password security.
                            </p>
                        </div>
                        <motion.button
                            type="button"
                            onClick={saveProfile}
                            disabled={savingProfile}
                            whileHover={savingProfile || shouldReduceMotion ? undefined : { y: -2 }}
                            whileTap={savingProfile ? undefined : { scale: 0.98 }}
                            className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition ${savingProfile ? "cursor-not-allowed opacity-70" : "hk-primary-hover"}`}
                            style={{
                                backgroundColor: "var(--color-primary)",
                                color: "var(--color-primary-content)",
                                boxShadow: "0 12px 26px -12px color-mix(in srgb, var(--color-primary) 90%, transparent)",
                            }}
                        >
                            <Save size={17} />
                            {savingProfile ? "Saving..." : "Save Profile"}
                        </motion.button>
                    </div>
                </motion.section>

                <motion.section
                    initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={shouldReduceMotion ? { duration: 0.01 } : { delay: 0.12, duration: 0.48, ease: "easeOut" }}
                    className="grid gap-5 xl:grid-cols-[0.85fr_1.35fr]"
                >
                    <ProfileSummary profile={profile} />
                    <EditableProfile profile={profile} onChange={updateProfile} />
                </motion.section>

                <motion.div
                    initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={shouldReduceMotion ? { duration: 0.01 } : { delay: 0.30, duration: 0.34, ease: "easeOut" }}
                >
                    <PasswordPanel password={password} onChange={updatePassword} onSave={savePassword} saving={savingPassword} />
                </motion.div>
            </motion.div>
        </AdminShell>
    );
}

function ProfileSummary({ profile }) {
    return (
        <article
            className="relative overflow-hidden rounded-[1.5rem] border p-6 hk-admin-card"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
            {/* Identity card gets its own colour field so it reads as the
                subject of the page rather than another form panel. */}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full"
                style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--color-primary) 16%, transparent), transparent 70%)" }}
            />

            <div className="relative flex items-center gap-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.4rem] text-2xl font-black"
                    style={{
                        backgroundColor: "var(--color-primary)",
                        color: "var(--color-primary-content)",
                        boxShadow: "0 14px 30px -12px color-mix(in srgb, var(--color-primary) 90%, transparent)",
                    }}
                >
                    {getInitials(profile)}
                </motion.div>
                <div className="min-w-0">
                    <h3 className="truncate text-2xl font-black tracking-tight">{getDisplayName(profile, "Administrator")}</h3>
                    <span
                        className="hk-pill mt-1.5 inline-block"
                        style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, transparent)", color: "var(--color-primary)" }}
                    >
                        {profile.role}
                    </span>
                </div>
            </div>

            <div className="relative mt-6 space-y-2.5">
                <SummaryRow icon={ShieldCheck} label="Role" value={profile.role} />
                <SummaryRow icon={Mail} label="Email" value={profile.email} />
            </div>

            <div
                className="relative mt-6 rounded-2xl border p-4"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
            >
                <p className="text-sm font-black">Admin access profile</p>
                <p className="mt-2 text-sm font-medium leading-6" style={{ color: "var(--color-muted)" }}>
                    This account is used for kiosk monitoring, health record review, reports, settings, and audit actions.
                </p>
            </div>
        </article>
    );
}

function EditableProfile({ profile, onChange }) {
    return (
        <article className="rounded-[1.5rem] border p-6 hk-admin-card" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div>
                <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-primary)" }}>Editable information</p>
                <h3 className="mt-2 text-xl font-black">Administrator Details</h3>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
                <TextField label="Firstname" value={profile.firstname} onChange={(value) => onChange("firstname", value)} />
                <TextField label="Lastname" value={profile.lastname} onChange={(value) => onChange("lastname", value)} />
                <TextField label="Email" type="email" value={profile.email} onChange={(value) => onChange("email", value)} readOnly />
                <TextField label="Role" value={profile.role} onChange={(value) => onChange("role", value)} readOnly />
            </div>
        </article>
    );
}

function PasswordPanel({ password, onChange, onSave, saving }) {
    // Same PASSWORD_RULES the shared change-password modal uses, so the guide
    // here cannot drift from the one shown elsewhere or from what the server
    // enforces via Password::defaults().
    const checks = PASSWORD_RULES.map((rule) => ({ label: rule.label, valid: rule.test(password.next || "") }));
    const met = checks.filter((check) => check.valid).length;
    const confirmMatches = Boolean(password.confirm) && password.next === password.confirm;

    const strength = met <= 2 ? "Weak" : met <= 4 ? "Medium" : "Strong";
    const strengthColor =
        strength === "Strong" ? "var(--color-success)" : strength === "Medium" ? "var(--color-warning)" : "var(--color-error)";


    return (
        <article className="rounded-[1.5rem] border p-6 hk-admin-card" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="flex items-start gap-3 border-b pb-5" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: "var(--color-surface)", color: "var(--color-primary)" }}>
                    <LockKeyhole size={21} />
                </div>
                <div>
                    <h3 className="text-xl font-black">Change Password</h3>
                    <p className="mt-1 text-sm font-semibold leading-6" style={{ color: "var(--color-muted)" }}>
                        Update the admin password using the current password, new password, and confirmation.
                    </p>
                </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <TextField label="Current Password" type="password" value={password.current} onChange={(value) => onChange("current", value)} />
                <TextField label="New Password" type="password" value={password.next} onChange={(value) => onChange("next", value)} />
                <TextField label="Confirm Password" type="password" value={password.confirm} onChange={(value) => onChange("confirm", value)} />
            </div>

            {/* Always on screen, not revealed on first keystroke: the requirements
                are what someone needs *before* choosing a password, not feedback
                after they have already picked one. */}
            <div
                className="mt-5 rounded-[1.25rem] border p-4"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
            >
                <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black">Password strength</p>
                    <span className="text-xs font-black" style={{ color: strengthColor }}>{strength}</span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-border)" }}>
                    <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${(met / PASSWORD_RULES.length) * 100}%`, backgroundColor: strengthColor }}
                    />
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {[...checks, { label: "Confirmation matches", valid: confirmMatches }].map((check) => (
                        <div
                            key={check.label}
                            className="flex items-center gap-2 text-xs font-bold"
                            style={{ color: check.valid ? "var(--color-success)" : "var(--color-muted)" }}
                        >
                            {check.valid ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                            {check.label}
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-5 flex justify-end">
                <button
                    type="button"
                    onClick={onSave}
                    disabled={saving}
                    className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-black transition ${saving ? "opacity-70 cursor-not-allowed" : "hk-admin-nav-hover"}`}
                    style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                >
                    <LockKeyhole size={17} />
                    {saving ? "Updating..." : "Update Password"}
                </button>
            </div>
        </article>
    );
}

function TextField({ label, value, onChange, type = "text", readOnly = false }) {
    const [visible, setVisible] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword && visible ? "text" : type;

    return (
        <label className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--color-muted)" }}>
            {label}
            <span className="relative mt-2 block">
                <input
                    type={inputType}
                    value={value}
                    readOnly={readOnly}
                    onChange={(event) => {
                        if (! readOnly) onChange(event.target.value);
                    }}
                    className={`h-12 w-full rounded-xl border px-4 text-sm font-black outline-none ${isPassword ? "pr-12" : ""} ${readOnly ? "cursor-not-allowed opacity-70" : ""}`}
                    style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                />
                {isPassword ? (
                    <button
                        type="button"
                        onClick={() => setVisible((current) => ! current)}
                        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg transition hk-soft-hover"
                        style={{ color: "var(--color-muted)" }}
                        aria-label={visible ? `Hide ${label}` : `Show ${label}`}
                    >
                        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                ) : null}
            </span>
        </label>
    );
}

function SummaryRow({ icon: Icon, label, value }) {
    return (
        <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3"
            style={{ backgroundColor: "var(--color-surface)" }}
        >
            <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 11%, transparent)", color: "var(--color-primary)" }}
            >
                <Icon size={17} />
            </span>
            <div className="min-w-0">
                <p className="text-[0.62rem] font-black uppercase tracking-[0.16em]" style={{ color: "var(--color-muted)" }}>{label}</p>
                <p className="mt-0.5 truncate text-sm font-black">{value}</p>
            </div>
        </div>
    );
}
