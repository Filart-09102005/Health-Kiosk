import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import ModalShell from "./ModalShell";
import PasswordField from "./PasswordField";
import { useToast } from "./Toast";
import { authService, getErrorMessage } from "../Pages/Auth/services/authService";

const EMPTY = { current: "", next: "", confirmation: "" };

export const PASSWORD_RULES = [
    { label: "Minimum 8 characters", test: (v) => v.length >= 8 },
    { label: "At least 1 uppercase letter", test: (v) => /[A-Z]/.test(v) },
    { label: "At least 1 lowercase letter", test: (v) => /[a-z]/.test(v) },
    { label: "At least 1 number", test: (v) => /\d/.test(v) },
    { label: "At least 1 special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

/**
 * Self-contained change-password flow: owns its fields, its rules, its request
 * and its toasts. A host screen only supplies `open`/`onClose`, which keeps the
 * password concern out of whatever form it is opened from.
 *
 * @param onSuccess optional callback after the password is changed
 */
export default function ChangePasswordModal({ open, onClose, onSuccess }) {
    const { showToast } = useToast();
    const [passwords, setPasswords] = useState(EMPTY);
    const [visible, setVisible] = useState({ current: false, next: false, confirmation: false });
    const [saving, setSaving] = useState(false);

    // Never leave a typed password sitting in memory for the next open.
    useEffect(() => {
        if (!open) {
            setPasswords(EMPTY);
            setVisible({ current: false, next: false, confirmation: false });
        }
    }, [open]);

    const update = (field, value) => setPasswords((current) => ({ ...current, [field]: value }));
    const toggle = (field) => setVisible((current) => ({ ...current, [field]: !current[field] }));

    const rules = useMemo(
        () => [
            ...PASSWORD_RULES.map((rule) => ({ label: rule.label, valid: rule.test(passwords.next) })),
            {
                label: "Confirm password matches",
                valid: passwords.next.length > 0 && passwords.next === passwords.confirmation,
            },
        ],
        [passwords.next, passwords.confirmation],
    );

    const strengthScore = rules.slice(0, 5).filter((rule) => rule.valid).length;
    const strengthLabel = strengthScore <= 2 ? "Weak" : strengthScore <= 4 ? "Medium" : "Strong";
    const strengthColor =
        strengthLabel === "Strong"
            ? "var(--color-success)"
            : strengthLabel === "Medium"
              ? "var(--color-primary)"
              : "var(--color-error)";

    const isDirty = Boolean(passwords.current || passwords.next || passwords.confirmation);
    const confirmState = passwords.confirmation
        ? (passwords.next === passwords.confirmation ? "match" : "mismatch")
        : "default";

    const handleSubmit = async () => {
        if (!passwords.current) {
            showToast({ type: "error", title: "Password Error", message: "Please enter your current password." });
            return;
        }
        if (passwords.next !== passwords.confirmation) {
            showToast({ type: "error", title: "Password Error", message: "New password and confirmation do not match." });
            return;
        }
        if (rules.some((rule) => !rule.valid)) {
            showToast({ type: "error", title: "Password Error", message: "Please ensure your new password meets all security rules." });
            return;
        }

        setSaving(true);
        try {
            await authService.updatePassword({
                current: passwords.current,
                next: passwords.next,
                next_confirmation: passwords.confirmation,
            });
            showToast({ type: "success", title: "Password Updated", message: "Your password has been changed successfully." });
            onSuccess?.();
            onClose?.();
        } catch (error) {
            showToast({ type: "error", title: "Update Failed", message: getErrorMessage(error) });
        } finally {
            setSaving(false);
        }
    };

    return (
        <ModalShell
            open={open}
            onClose={saving ? undefined : onClose}
            title="Change Password"
            description="Enter your current password before setting a new secure password."
            icon={KeyRound}
            closeOnOverlay={!saving}
            footer={
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="rounded-2xl border px-4 py-3 text-sm font-black transition hk-soft-hover disabled:opacity-50"
                        style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition hk-primary-hover disabled:opacity-60"
                        style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-content)" }}
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {saving ? "Updating..." : "Update password"}
                    </button>
                </div>
            }
        >
            <div className="grid gap-4">
                <PasswordField
                    label="Current password"
                    placeholder="Enter your current password"
                    value={passwords.current}
                    onChange={(value) => update("current", value)}
                    show={visible.current}
                    onToggle={() => toggle("current")}
                />
                <PasswordField
                    label="New password"
                    placeholder="Enter a new secure password"
                    value={passwords.next}
                    onChange={(value) => update("next", value)}
                    show={visible.next}
                    onToggle={() => toggle("next")}
                />
                <PasswordField
                    label="Confirm new password"
                    placeholder="Re-enter your new password to confirm"
                    value={passwords.confirmation}
                    onChange={(value) => update("confirmation", value)}
                    show={visible.confirmation}
                    onToggle={() => toggle("confirmation")}
                    validationState={confirmState}
                />
            </div>

            <AnimatePresence>
                {isDirty && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 20 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden rounded-2xl border p-4"
                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                    >
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-black" style={{ color: "var(--color-text)" }}>Password Strength</p>
                            <span className="text-xs font-black" style={{ color: strengthColor }}>{strengthLabel}</span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-border)" }}>
                            <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${(strengthScore / 5) * 100}%`, backgroundColor: strengthColor }}
                            />
                        </div>

                        <div className="mt-4 grid gap-2">
                            {rules.map((rule) => (
                                <div
                                    key={rule.label}
                                    className="flex items-center gap-2 text-xs font-semibold"
                                    style={{ color: rule.valid ? "var(--color-success)" : "var(--color-muted)" }}
                                >
                                    <CheckCircle2 size={14} />
                                    {rule.label}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </ModalShell>
    );
}
