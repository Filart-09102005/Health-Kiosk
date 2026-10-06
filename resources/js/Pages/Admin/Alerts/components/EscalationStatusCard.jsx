import { Siren } from "lucide-react";

export default function EscalationStatusCard({ status = "Monitoring", detail = "No external escalation has been sent." }) {
    return (
        <div className="rounded-[1.25rem] border p-4" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--color-muted)" }}>Escalation</p>
                    <p className="mt-1 text-xl font-black">{status}</p>
                    <p className="mt-2 text-sm font-bold" style={{ color: "var(--color-muted)" }}>{detail}</p>
                </div>
                <Siren size={20} style={{ color: "var(--color-primary)" }} />
            </div>
        </div>
    );
}
