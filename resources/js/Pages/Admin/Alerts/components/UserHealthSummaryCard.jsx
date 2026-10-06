import { Stethoscope } from "lucide-react";

function initials(name) {
    return String(name || "")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "?";
}

export default function UserHealthSummaryCard({ alert }) {
    return (
        <div className="rounded-[1.25rem] border p-4" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <p className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--color-muted)" }}>Student health summary</p>

            <div className="mt-3 flex items-center gap-3">
                <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black"
                    style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 15%, transparent)", color: "var(--color-primary)" }}
                >
                    {initials(alert.fullName)}
                </div>
                <div className="min-w-0">
                    <p className="truncate font-black" style={{ color: "var(--color-text)" }}>{alert.fullName}</p>
                    <p className="truncate text-xs font-bold uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
                        {alert.role} · {alert.department}
                    </p>
                </div>
            </div>

            <div
                className="mt-3 flex items-start gap-2 rounded-[1rem] p-3"
                style={{ backgroundColor: "var(--color-surface)" }}
            >
                <Stethoscope size={16} className="mt-0.5 shrink-0" style={{ color: "var(--color-primary)" }} />
                <p className="text-sm font-bold leading-6" style={{ color: "var(--color-text)" }}>{alert.advice}</p>
            </div>
        </div>
    );
}
