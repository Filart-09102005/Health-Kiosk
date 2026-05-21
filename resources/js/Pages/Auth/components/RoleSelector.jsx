import { Check, GraduationCap, UserRoundCheck } from "lucide-react";

const roles = [
    {
        value: "student",
        title: "STUDENT",
        description: "For learners using the kiosk for health measurements.",
        icon: GraduationCap,
    },
    {
        value: "teacher",
        title: "TEACHER",
        description: "For faculty and staff health kiosk access.",
        icon: UserRoundCheck,
    },
];

export default function RoleSelector({ value, onChange }) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            {roles.map((role) => {
                const Icon = role.icon;
                const isSelected = value === role.value;

                return (
                    <button
                        key={role.value}
                        type="button"
                        onClick={() => onChange(role.value)}
                        className="group relative rounded-xl border p-5 text-left transition duration-200 hover:-translate-y-1"
                        style={{
                            backgroundColor: "var(--auth-panel)",
                            borderColor: isSelected ? "var(--color-primary)" : "var(--auth-border)",
                            color: "var(--auth-text)",
                        }}
                    >
                        {isSelected ? (
                            <span className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-white" style={{ backgroundColor: "var(--color-primary)" }}>
                                <Check size={16} />
                            </span>
                        ) : null}
                        <div className="flex items-center gap-4">
                            <div
                                className="flex h-12 w-12 items-center justify-center rounded-xl transition group-hover:scale-105"
                                style={{
                                    backgroundColor: isSelected ? "color-mix(in srgb, var(--color-primary), transparent 84%)" : "var(--auth-control)",
                                    color: isSelected ? "var(--color-primary)" : "var(--auth-muted)",
                                }}
                            >
                                <Icon size={26} />
                            </div>
                            <div>
                                <div className="text-lg font-black tracking-wide">{role.title}</div>
                                <p
                                    className="mt-1 text-sm leading-5"
                                    style={{ color: "var(--auth-muted)" }}
                                >
                                    {role.description}
                                </p>
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
