import { useEffect, useState } from "react";
import { KeyRound, Loader2, Lock, Pencil, User as UserIcon, Mail, QrCode, ShieldCheck, ChevronRight, X } from "lucide-react";
import DrawerShell from "../../Global/DrawerShell";
import { useToast } from "../../Global/Toast";
import { authService, getErrorMessage } from "../../Auth/services/authService";
import SelectField from "../../Global/SelectField";
import ChangePasswordModal from "../../Global/ChangePasswordModal";
import { getDisplayName, getInitials } from "../../../Global/userIdentity";

const studentDepartments = [
    ["", "Choose department"],
    ["COLLEGE", "College"],
    ["BED", "Basic Education (BED)"],
];
const personnelDepartments = [
    ["", "Choose department/role"],
    ["COLLEGE INSTRUCTOR", "College Instructor"],
    ["BED INSTRUCTOR", "Basic Education (BED) Instructor"],
    ["NTP", "Non-Teaching Personnel (NTP)"],
];
const seniorHighGrades = ["Grade 11", "Grade 12"];
const gradeLevels = ["", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
const strands = ["ABM", "HUMSS", "STEM"];
const yearLevels = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const programs = ["BSIT", "BSED", "BEED", "BSHM", "BSBA"];

const inputClass = "w-full rounded-2xl border px-4 py-3 text-sm font-semibold outline-none transition focus:ring-2";
function formatBirthdayAndAge(birthdayStr, backendAge) {
    if (!birthdayStr) return null;
    const cleanStr = String(birthdayStr).split("T")[0];
    const parts = cleanStr.split("-");
    let birthDate;
    if (parts.length === 3) {
        birthDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    } else {
        birthDate = new Date(birthdayStr);
    }
    if (Number.isNaN(birthDate.getTime())) return birthdayStr;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    const formattedDate = birthDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    return `${formattedDate} (${age} yrs)`;
}

function ReadOnlyField({ label, value, icon: Icon }) {
    if (!value || value === "Not available" || value === "null" || value === "undefined") {
        return null;
    }

    return (
        <div className="group relative block cursor-not-allowed">
            <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase flex items-center gap-1.5" style={{ color: "var(--color-muted)" }}>
                    {Icon && <Icon size={13} />}
                    {label}
                </span>
                <span
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-black uppercase tracking-wider flex items-center gap-1 rounded-md px-1.5 py-0.5 border shrink-0"
                    style={{
                        backgroundColor: "var(--color-card)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-muted)",
                    }}
                >
                    <Lock size={10} />
                    Verified
                </span>
            </div>
            <div
                className="mt-1.5 flex items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-sm font-black truncate transition-all"
                style={{
                    backgroundColor: "var(--color-surface)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text)",
                }}
            >
                <span className="truncate">{value}</span>
                <Lock size={14} className="shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: "var(--color-muted)" }} />
            </div>
        </div>
    );
}

/**
 * @param onUpdated Called with the saved fields so an ancestor holding a stale
 *                  copy of the user (the header) can catch up without a reload.
 */
export default function ProfileDrawer({ open, onClose, user: propUser = {}, onUpdated }) {
    const { showToast } = useToast();
    const [userData, setUserData] = useState(propUser);
    const [firstname, setFirstname] = useState(propUser?.firstname || "");
    const [lastname, setLastname] = useState(propUser?.lastname || "");
    const [department, setDepartment] = useState(propUser?.department || "");
    const [yearLevel, setYearLevel] = useState(propUser?.year_level || "");
    const [program, setProgram] = useState(propUser?.program || "");
    const [gradeLevel, setGradeLevel] = useState(propUser?.grade_level || "");
    const [strand, setStrand] = useState(propUser?.strand || "");
    const [gender, setGender] = useState(propUser?.gender || "");
    const [birthday, setBirthday] = useState(propUser?.birthday ? String(propUser.birthday).split("T")[0] : "");
    const [saving, setSaving] = useState(false);
    const [passwordOpen, setPasswordOpen] = useState(false);
    // The drawer opens in view mode; the Edit toggle unlocks the fields.
    const [editing, setEditing] = useState(false);

    // Restore every field from the record we last loaded — used by Cancel and
    // whenever the drawer reopens, so an abandoned edit never lingers.
    const revertFields = (source) => {
        setFirstname(source?.firstname || "");
        setLastname(source?.lastname || "");
        setDepartment(source?.department || "");
        setYearLevel(source?.year_level || "");
        setProgram(source?.program || "");
        setGradeLevel(source?.grade_level || "");
        setStrand(source?.strand || "");
        setGender(source?.gender || "");
        setBirthday(source?.birthday ? String(source.birthday).split("T")[0] : "");
    };

    useEffect(() => {
        if (open) {
            setEditing(false);
            setUserData(propUser);
            setFirstname(propUser?.firstname || "");
            setLastname(propUser?.lastname || "");
            setDepartment(propUser?.department || "");
            setYearLevel(propUser?.year_level || "");
            setProgram(propUser?.program || "");
            setGradeLevel(propUser?.grade_level || "");
            setStrand(propUser?.strand || "");
            setGender(propUser?.gender || "");
            setBirthday(propUser?.birthday ? String(propUser.birthday).split("T")[0] : "");

            // Fetch live user record from database to ensure all fields are loaded
            authService
                .currentUser()
                .then((res) => {
                    if (res?.data?.user) {
                        const dbUser = res.data.user;
                        setUserData(dbUser);
                        setFirstname(dbUser.firstname || "");
                        setLastname(dbUser.lastname || "");
                        setDepartment(dbUser.department || "");
                        setYearLevel(dbUser.year_level || "");
                        setProgram(dbUser.program || "");
                        setGradeLevel(dbUser.grade_level || "");
                        setStrand(dbUser.strand || "");
                        setGender(dbUser.gender || "");
                        setBirthday(dbUser.birthday ? String(dbUser.birthday).split("T")[0] : "");
                    }
                })
                .catch(() => {});
        }
    }, [open, propUser?.id]);

    const activeUser = userData || propUser || {};
    // Draft fields (firstname/lastname state) win over the loaded record, so
    // the header reflects what's being typed rather than the last save.
    const displayUser = {
        firstname: firstname || activeUser?.firstname || "",
        lastname: lastname || activeUser?.lastname || "",
        email: activeUser?.email,
    };
    const fullName = getDisplayName(displayUser, "Your Account");
    const initials = getInitials(displayUser);

    // View mode keeps values at full contrast — it is a display state, not a
    // disabled one — while dropping the affordances that invite typing.
    const viewOnlyClass = editing ? "" : "cursor-default focus:ring-0";
    const fieldStyle = {
        backgroundColor: "var(--color-surface)",
        borderColor: editing
            ? "var(--color-border)"
            : "color-mix(in srgb, var(--color-border) 55%, transparent)",
        color: "var(--color-text)",
    };

    const handleSave = async () => {
        if (!firstname.trim() || !lastname.trim()) {
            showToast({ type: "error", title: "Validation Error", message: "First name and last name cannot be empty." });
            return;
        }

        setSaving(true);

        try {
            const nameChanged = firstname !== activeUser?.firstname || lastname !== activeUser?.lastname;
            const dbBirthday = activeUser?.birthday ? String(activeUser.birthday).split("T")[0] : "";
            const academicChanged =
                department !== (activeUser?.department || "") ||
                yearLevel !== (activeUser?.year_level || "") ||
                program !== (activeUser?.program || "") ||
                gradeLevel !== (activeUser?.grade_level || "") ||
                strand !== (activeUser?.strand || "") ||
                gender !== (activeUser?.gender || "") ||
                birthday !== dbBirthday;

            if (nameChanged || academicChanged) {
                const saved = {
                    firstname,
                    lastname,
                    department,
                    year_level: yearLevel,
                    program,
                    grade_level: gradeLevel,
                    strand,
                    gender,
                    birthday,
                };

                await authService.updateProfile(saved);

                // Keep the local record in step so Cancel later reverts to what
                // was actually saved, not to the values from when it opened.
                setUserData((current) => ({ ...current, ...saved }));

                // Let the header (and anything else upstream) catch up.
                onUpdated?.(saved);
            }

            showToast({ type: "success", title: "Profile Updated", message: "Your changes have been saved successfully." });
            // Drop back to view mode so the user sees the saved result.
            setEditing(false);
        } catch (error) {
            showToast({ type: "error", title: "Update Failed", message: getErrorMessage(error) });
        } finally {
            setSaving(false);
        }
    };

    return (
        <DrawerShell
            open={open}
            onClose={onClose}
            title="Profile"
            description="Manage kiosk identity and account information."
            widePortrait
            // Nothing to save while viewing, so the footer only exists in edit mode.
            footer={
                editing ? (
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition hk-primary-hover disabled:opacity-60"
                        style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-content)" }}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {saving ? "Saving..." : "Save changes"}
                    </button>
                ) : null
            }
        >
            <div className="space-y-5">
                {/* ── User Overview Badge ── */}
                <section className="rounded-3xl border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                    <div className="flex items-center gap-4">
                        <div
                            className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-black shrink-0 shadow-md"
                            style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-content)" }}
                        >
                            {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="truncate text-xl font-black" style={{ color: "var(--color-text)" }}>{fullName}</h3>
                            {activeUser?.email ? (
                                <p className="truncate text-sm" style={{ color: "var(--color-muted)" }}>
                                    {activeUser.email}
                                </p>
                            ) : null}
                            <p className="mt-1 text-xs font-black uppercase tracking-wider" style={{ color: "var(--color-primary)" }}>
                                {activeUser?.role || "student"} {activeUser?.department ? `• ${activeUser.department}` : ""}
                            </p>
                        </div>
                    </div>
                </section>

                {/* ── Editable Profile ── */}
                <section className="rounded-3xl border p-5" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                    <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h3 className="font-black text-base" style={{ color: "var(--color-text)" }}>
                                {editing ? "Edit Profile" : "Profile Details"}
                            </h3>
                            <p className="mt-0.5 text-xs" style={{ color: "var(--color-muted)" }}>
                                {editing
                                    ? "Update your personal and academic information, then save."
                                    : "Tap Edit to update your personal and academic information."}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                if (editing) revertFields(activeUser); // Cancel discards the edit.
                                setEditing(!editing);
                            }}
                            disabled={saving}
                            className="flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-black transition hk-soft-hover disabled:opacity-50"
                            style={{
                                backgroundColor: editing ? "var(--color-surface)" : "var(--color-primary)",
                                borderColor: editing ? "var(--color-border)" : "var(--color-primary)",
                                color: editing ? "var(--color-muted)" : "var(--color-primary-content)",
                            }}
                        >
                            {editing ? <X size={14} /> : <Pencil size={14} />}
                            {editing ? "Cancel" : "Edit"}
                        </button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                            <span className="text-xs font-black uppercase" style={{ color: "var(--color-muted)" }}>
                                First Name
                            </span>
                            <input
                                type="text"
                                value={firstname}
                                onChange={(e) => setFirstname(e.target.value)}
                                readOnly={!editing}
                                className={`${inputClass} mt-2 ${viewOnlyClass}`}
                                style={fieldStyle}
                            />
                        </label>

                        <label className="block">
                            <span className="text-xs font-black uppercase" style={{ color: "var(--color-muted)" }}>
                                Last Name
                            </span>
                            <input
                                type="text"
                                value={lastname}
                                onChange={(e) => setLastname(e.target.value)}
                                readOnly={!editing}
                                className={`${inputClass} mt-2 ${viewOnlyClass}`}
                                style={fieldStyle}
                            />
                        </label>

                        <SelectField
                            label="Gender"
                            value={gender}
                            onChange={(value) => setGender(value)}
                            options={[
                                ["", "Choose gender"],
                                ["male", "Male"],
                                ["female", "Female"],
                                ["other", "Other"],
                                ["prefer_not_to_say", "Prefer not to say"]
                            ]}
                            readOnly={!editing}
                        />

                        <label className="block">
                            <span className="text-xs font-black uppercase flex items-center gap-1.5" style={{ color: "var(--color-muted)" }}>
                                Birthday
                                {birthday && activeUser?.age ? <span className="lowercase normal-case">({activeUser.age} yrs)</span> : null}
                            </span>
                            <input
                                type="date"
                                value={birthday}
                                onChange={(e) => setBirthday(e.target.value)}
                                max={new Date().toISOString().split("T")[0]}
                                // A read-only date input still opens its picker,
                                // so this one has to be genuinely disabled.
                                disabled={!editing}
                                className={`${inputClass} mt-2 h-[3.25rem] ${viewOnlyClass} disabled:opacity-100`}
                                style={fieldStyle}
                            />
                        </label>

                        <SelectField
                            label="Department"
                            value={department}
                            onChange={(value) => setDepartment(value)}
                            options={[
                                ["", "Choose department"],
                                ...(activeUser?.role === "student" ? studentDepartments : personnelDepartments)
                            ].filter((opt, idx) => idx === 0 || opt[0])}
                            readOnly={!editing}
                        />

                        {department === "BED" && activeUser?.role === "student" ? (
                            <>
                                <SelectField
                                    label="Grade Level"
                                    value={gradeLevel}
                                    onChange={(value) => setGradeLevel(value)}
                                    options={[
                                        ["", "Choose grade level"],
                                        ...gradeLevels.filter(g => g).map((g) => [g, g]),
                                    ]}
                            readOnly={!editing}
                                />
                                {seniorHighGrades.includes(gradeLevel) ? (
                                    <SelectField
                                        label="Strand"
                                        value={strand}
                                        onChange={(value) => setStrand(value)}
                                        options={[
                                            ["", "Choose strand"],
                                            ...strands.map((s) => [s, s]),
                                        ]}
                            readOnly={!editing}
                                    />
                                ) : null}
                            </>
                        ) : department === "COLLEGE" && activeUser?.role === "student" ? (
                            <>
                                <SelectField
                                    label="Year Level"
                                    value={yearLevel}
                                    onChange={(value) => setYearLevel(value)}
                                    options={[
                                        ["", "Choose year level"],
                                        ...yearLevels.map((y) => [y, y]),
                                    ]}
                            readOnly={!editing}
                                />
                                <SelectField
                                    label="Program"
                                    value={program}
                                    onChange={(value) => setProgram(value)}
                                    options={[
                                        ["", "Choose program"],
                                        ...programs.map((p) => [p, p]),
                                    ]}
                            readOnly={!editing}
                                />
                            </>
                        ) : null}
                    </div>
                </section>

                {/* ── Account Access (Read-Only) ── */}
                <section className="rounded-3xl border p-5" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                    <h3 className="font-black text-base" style={{ color: "var(--color-text)" }}>Account Access</h3>
                    <p className="mt-0.5 text-xs mb-4" style={{ color: "var(--color-muted)" }}>
                        These values are verified database records and cannot be directly edited here.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <ReadOnlyField label="Email" value={activeUser?.email} icon={Mail} />
                        <ReadOnlyField label="Student / User ID" value={activeUser?.student_id || activeUser?.barcode} icon={UserIcon} />
                        <ReadOnlyField label="Barcode" value={activeUser?.barcode} icon={QrCode} />
                        <ReadOnlyField label="Role" value={activeUser?.role ? activeUser.role.toUpperCase() : null} icon={ShieldCheck} />
                    </div>
                </section>

                {/* ── Security ── */}
                <section className="rounded-3xl border p-5" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                    <h3 className="font-black text-base" style={{ color: "var(--color-text)" }}>Security</h3>
                    <p className="mt-0.5 text-xs mb-4" style={{ color: "var(--color-muted)" }}>
                        Keep your account secure with a strong, private password.
                    </p>

                    <button
                        type="button"
                        onClick={() => setPasswordOpen(true)}
                        className="flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition hk-soft-hover"
                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                    >
                        <span className="flex items-center gap-3">
                            <span
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                                style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-content)" }}
                            >
                                <KeyRound size={17} />
                            </span>
                            <span>
                                <span className="block text-sm font-black" style={{ color: "var(--color-text)" }}>Change Password</span>
                                <span className="block text-xs" style={{ color: "var(--color-muted)" }}>
                                    Set a new secure password
                                </span>
                            </span>
                        </span>
                        <ChevronRight size={18} className="shrink-0" style={{ color: "var(--color-muted)" }} />
                    </button>
                </section>
            </div>

            {/* Portals to <body>, so it layers above this drawer. */}
            <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
        </DrawerShell>
    );
}
