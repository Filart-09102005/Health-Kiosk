import { Eye, EyeOff, LockKeyhole, Mail, Save, ShieldCheck, UserCog } from "lucide-react";
import { useState } from "react";
import AdminShell from "../components/AdminShell";

const initialProfile = {
    firstname: "Health",
    lastname: "Kiosk",
    email: "smcbihealthkiosk@gmail.com",
    phone: "+63 900 000 0000",
    role: "Admin",
    department: "Clinic",
    position: "System Administrator",
};

export default function Profile({ navigate }) {
    const [profile, setProfile] = useState(initialProfile);
    const [password, setPassword] = useState({ current: "", next: "", confirm: "" });

    const updateProfile = (key, value) => {
        setProfile((current) => ({ ...current, [key]: value }));
    };

    const updatePassword = (key, value) => {
        setPassword((current) => ({ ...current, [key]: value }));
    };

    return (
        <AdminShell navigate={navigate} eyebrow="Account" title="Admin Profile">
            <div className="mt-6 space-y-6">
                <section className="rounded-[18px] border p-6 shadow-xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: "var(--color-primary)" }}>
                                Account profile
                            </p>
                            <h2 className="mt-2 text-3xl font-black">Profile Settings</h2>
                            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6" style={{ color: "var(--color-muted)" }}>
                                Manage administrator information, clinic assignment, and password security.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="inline-flex w-fit items-center gap-2 rounded-xl px-4 py-3 text-sm font-black text-white transition hk-primary-hover"
                            style={{ backgroundColor: "var(--color-primary)" }}
                        >
                            <Save size={17} />
                            Save Profile
                        </button>
                    </div>
                </section>

                <section className="grid gap-5 xl:grid-cols-[0.85fr_1.35fr]">
                    <ProfileSummary profile={profile} />
                    <EditableProfile profile={profile} onChange={updateProfile} />
                </section>

                <PasswordPanel password={password} onChange={updatePassword} />
            </div>
        </AdminShell>
    );
}

function ProfileSummary({ profile }) {
    return (
        <article className="rounded-[18px] border p-6 shadow-xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-lg" style={{ backgroundColor: "var(--color-primary)" }}>
                    {profile.firstname.charAt(0)}{profile.lastname.charAt(0)}
                </div>
                <div>
                    <h3 className="text-2xl font-black">{profile.firstname} {profile.lastname}</h3>
                    <p className="mt-1 text-sm font-bold" style={{ color: "var(--color-muted)" }}>{profile.position}</p>
                </div>
            </div>

            <div className="mt-6 space-y-3">
                <SummaryRow icon={ShieldCheck} label="Role" value={profile.role} />
                <SummaryRow icon={UserCog} label="Department" value={profile.department} />
                <SummaryRow icon={Mail} label="Email" value={profile.email} />
            </div>

            <div className="mt-6 rounded-2xl border p-4" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                <p className="text-sm font-black">Admin access profile</p>
                <p className="mt-2 text-sm font-semibold leading-6" style={{ color: "var(--color-muted)" }}>
                    This account is used for kiosk monitoring, health record review, reports, settings, and audit actions.
                </p>
            </div>
        </article>
    );
}

function EditableProfile({ profile, onChange }) {
    return (
        <article className="rounded-[18px] border p-6 shadow-xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div>
                <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-primary)" }}>Editable information</p>
                <h3 className="mt-2 text-xl font-black">Administrator Details</h3>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
                <TextField label="Firstname" value={profile.firstname} onChange={(value) => onChange("firstname", value)} />
                <TextField label="Lastname" value={profile.lastname} onChange={(value) => onChange("lastname", value)} />
                <TextField label="Email" type="email" value={profile.email} onChange={(value) => onChange("email", value)} />
                <TextField label="Phone" value={profile.phone} onChange={(value) => onChange("phone", value)} />
                <TextField label="Role" value={profile.role} onChange={(value) => onChange("role", value)} />
                <TextField label="Department" value={profile.department} onChange={(value) => onChange("department", value)} />
                <div className="md:col-span-2">
                    <TextField label="Position" value={profile.position} onChange={(value) => onChange("position", value)} />
                </div>
            </div>
        </article>
    );
}

function PasswordPanel({ password, onChange }) {
    return (
        <article className="rounded-[18px] border p-6 shadow-xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
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

            <div className="mt-5 flex justify-end">
                <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-black transition hk-admin-nav-hover"
                    style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                >
                    <LockKeyhole size={17} />
                    Update Password
                </button>
            </div>
        </article>
    );
}

function TextField({ label, value, onChange, type = "text" }) {
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
                    onChange={(event) => onChange(event.target.value)}
                    className={`h-12 w-full rounded-xl border px-4 text-sm font-black outline-none ${isPassword ? "pr-12" : ""}`}
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
        <div className="flex items-center gap-3 rounded-xl border p-3" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <Icon size={18} style={{ color: "var(--color-primary)" }} />
            <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>{label}</p>
                <p className="truncate text-sm font-black">{value}</p>
            </div>
        </div>
    );
}
