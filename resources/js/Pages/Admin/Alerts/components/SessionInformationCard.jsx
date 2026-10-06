import { CalendarClock, IdCard, ShieldCheck, UserCheck } from "lucide-react";

const STATUS_COLOR = {
    Completed: "var(--color-success)",
    Active: "var(--color-primary)",
    Incomplete: "var(--color-muted)",
};

export default function SessionInformationCard({ alert }) {
    return (
        <div className="rounded-[1.25rem] border p-4" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <p className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--color-muted)" }}>Session information</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <Info
                    icon={ShieldCheck}
                    label="Session status"
                    value={alert.sessionStatus}
                    valueColor={STATUS_COLOR[alert.sessionStatus] || "var(--color-text)"}
                />
                <Info icon={CalendarClock} label="Triggered" value={alert.triggeredAt} />
                <Info icon={UserCheck} label="Reviewed by" value={alert.reviewedBy} />
                <Info icon={IdCard} label="School ID" value={alert.schoolId} />
            </div>
        </div>
    );
}

function Info({ icon: Icon, label, value, valueColor }) {
    return (
        <div className="rounded-[1rem] p-3" style={{ backgroundColor: "var(--color-surface)" }}>
            <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
                {Icon && <Icon size={12} />}
                {label}
            </p>
            <p className="mt-1 truncate font-bold" style={{ color: valueColor || "var(--color-text)" }}>{value}</p>
        </div>
    );
}
