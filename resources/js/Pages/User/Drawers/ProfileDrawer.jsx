import { useMemo, useState } from "react";
import { CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";
import DrawerShell from "../../Global/DrawerShell";

const inputClass = "w-full rounded-2xl border px-4 py-3 text-sm font-semibold outline-none transition focus:ring-2";

function PasswordField({ label, value, onChange, visible, onToggle }) {
    return (
        <label className="block">
            <span className="text-xs font-black uppercase" style={{ color: "var(--color-muted)" }}>
                {label}
            </span>
            <div
                className="mt-2 flex items-center gap-3 rounded-2xl border px-4 py-3"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
            >
                <Lock size={17} style={{ color: "var(--color-muted)" }} />
                <input
                    type={visible ? "text" : "password"}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="w-full bg-transparent text-sm font-semibold outline-none"
                    style={{ color: "var(--color-text)" }}
                    autoComplete="new-password"
                />
                <button
                    type="button"
                    onClick={onToggle}
                    className="rounded-lg p-1 transition hk-soft-hover"
                    style={{ color: "var(--color-muted)" }}
                    aria-label={visible ? "Hide password" : "Show password"}
                >
                    {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
            </div>
        </label>
    );
}

function ReadOnlyField({ label, value }) {
    return (
        <div className="block">
            <span className="text-xs font-black uppercase" style={{ color: "var(--color-muted)" }}>
                {label}
            </span>
            <div
                className="mt-2 rounded-2xl border px-4 py-3 text-sm font-black"
                style={{
                    backgroundColor: "var(--color-surface)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text)",
                }}
            >
                {value || "Not available"}
            </div>
        </div>
    );
}

export default function ProfileDrawer({ open, onClose, user = {} }) {
    const fullName = `${user?.firstname || "Health"} ${user?.lastname || "Kiosk"}`;
    const [passwords, setPasswords] = useState({
        current: "",
        next: "",
        confirmation: "",
    });
    const [visible, setVisible] = useState({
        current: false,
        next: false,
        confirmation: false,
    });

    const passwordRules = useMemo(
        () => [
            { label: "Minimum 8 characters", valid: passwords.next.length >= 8 },
            { label: "At least 1 uppercase letter", valid: /[A-Z]/.test(passwords.next) },
            { label: "At least 1 lowercase letter", valid: /[a-z]/.test(passwords.next) },
            { label: "At least 1 number", valid: /\d/.test(passwords.next) },
            { label: "At least 1 special character", valid: /[^A-Za-z0-9]/.test(passwords.next) },
            { label: "Confirm password matches", valid: passwords.next.length > 0 && passwords.next === passwords.confirmation },
        ],
        [passwords.next, passwords.confirmation],
    );

    const strengthScore = passwordRules.slice(0, 5).filter((rule) => rule.valid).length;
    const strengthLabel = strengthScore <= 2 ? "Weak" : strengthScore <= 4 ? "Medium" : "Strong";
    const strengthColor =
        strengthLabel === "Strong"
            ? "var(--color-success)"
            : strengthLabel === "Medium"
              ? "var(--color-primary)"
              : "var(--color-error)";

    const updatePassword = (field, value) => {
        setPasswords((current) => ({ ...current, [field]: value }));
    };

    const toggleVisible = (field) => {
        setVisible((current) => ({ ...current, [field]: ! current[field] }));
    };

    return (
        <DrawerShell
            open={open}
            onClose={onClose}
            title="Profile"
            description="Manage kiosk identity and account information."
            footer={
                <button
                    type="button"
                    onClick={onClose}
                    className="w-full rounded-2xl px-4 py-3 text-sm font-black text-white transition hk-primary-hover"
                    style={{ backgroundColor: "var(--color-primary)" }}
                >
                    Save changes
                </button>
            }
        >
            <div className="space-y-5">
                <section className="rounded-3xl border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                    <div className="flex items-center gap-4">
                        <div
                            className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-black text-white"
                            style={{ backgroundColor: "var(--color-primary)" }}
                        >
                            {fullName.slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                            <h3 className="truncate text-xl font-black">{fullName}</h3>
                            <p className="truncate text-sm" style={{ color: "var(--color-muted)" }}>
                                {user?.email || "Email not available"}
                            </p>
                            <p className="mt-1 text-xs font-black uppercase" style={{ color: "var(--color-primary)" }}>
                                {user?.role || "student"} - {user?.department || "COLLEGE"}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border p-5" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                    <h3 className="font-black">Editable profile</h3>
                    <div className="mt-4 grid gap-4">
                        {[
                            ["First name", user?.firstname || ""],
                            ["Last name", user?.lastname || ""],
                        ].map(([label, value]) => (
                            <label key={label} className="block">
                                <span className="text-xs font-black uppercase" style={{ color: "var(--color-muted)" }}>
                                    {label}
                                </span>
                                <input
                                    defaultValue={value}
                                    className={`${inputClass} mt-2`}
                                    style={{
                                        backgroundColor: "var(--color-card)",
                                        borderColor: "var(--color-border)",
                                        color: "var(--color-text)",
                                        "--tw-ring-color": "var(--color-primary)",
                                    }}
                                />
                            </label>
                        ))}
                    </div>
                </section>

                <section className="rounded-3xl border p-5" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                    <h3 className="font-black">Account access</h3>
                    <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
                        These values are controlled by the system and cannot be edited here.
                    </p>
                    <div className="mt-4 grid gap-4">
                        <ReadOnlyField label="Email" value={user?.email} />
                        <ReadOnlyField label="Barcode" value={user?.barcode} />
                        <ReadOnlyField label="Role" value={user?.role} />
                    </div>
                </section>

                <section className="rounded-3xl border p-5" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                    <h3 className="font-black">Change password</h3>
                    <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
                        Enter your current password before setting a new secure password.
                    </p>

                    <div className="mt-4 grid gap-4">
                        <PasswordField
                            label="Current password"
                            value={passwords.current}
                            onChange={(value) => updatePassword("current", value)}
                            visible={visible.current}
                            onToggle={() => toggleVisible("current")}
                        />
                        <PasswordField
                            label="New password"
                            value={passwords.next}
                            onChange={(value) => updatePassword("next", value)}
                            visible={visible.next}
                            onToggle={() => toggleVisible("next")}
                        />
                        <PasswordField
                            label="Confirm new password"
                            value={passwords.confirmation}
                            onChange={(value) => updatePassword("confirmation", value)}
                            visible={visible.confirmation}
                            onToggle={() => toggleVisible("confirmation")}
                        />
                    </div>

                    <div className="mt-5 rounded-2xl border p-4" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-black">Password strength</p>
                            <span className="text-xs font-black" style={{ color: strengthColor }}>
                                {strengthLabel}
                            </span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-border)" }}>
                            <div
                                className="h-full rounded-full transition-all"
                                style={{
                                    width: `${(strengthScore / 5) * 100}%`,
                                    backgroundColor: strengthColor,
                                }}
                            />
                        </div>

                        <div className="mt-4 grid gap-2">
                            {passwordRules.map((rule) => (
                                <div
                                    key={rule.label}
                                    className="flex items-center gap-2 text-sm"
                                    style={{ color: rule.valid ? "var(--color-success)" : "var(--color-muted)" }}
                                >
                                    <CheckCircle2 size={15} />
                                    {rule.label}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </DrawerShell>
    );
}
