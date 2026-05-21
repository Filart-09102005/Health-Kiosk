import { Clock3, ShieldCheck, Siren } from "lucide-react";

const stats = [
    { label: "Median review", value: "4m 12s", icon: Clock3 },
    { label: "Reviewed today", value: "18", icon: ShieldCheck },
    { label: "Escalation rate", value: "16%", icon: Siren },
];

export default function AlertStatisticsPanel() {
    return (
        <div className="grid gap-3">
            {stats.map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between rounded-[14px] border p-4" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--color-muted)" }}>{label}</p>
                        <p className="mt-1 text-2xl font-black">{value}</p>
                    </div>
                    <Icon size={20} style={{ color: "var(--color-primary)" }} />
                </div>
            ))}
        </div>
    );
}
