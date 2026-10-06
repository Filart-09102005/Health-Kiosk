import { Activity } from "lucide-react";

export default function AlertActivityCard({ title = "Clinic activity", detail = "Alert reviewed and queued for follow-up." }) {
    return (
        <div className="rounded-[1.25rem] border p-4" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="flex items-center gap-3">
                <Activity size={18} style={{ color: "var(--color-primary)" }} />
                <div>
                    <p className="font-black">{title}</p>
                    <p className="text-sm font-bold" style={{ color: "var(--color-muted)" }}>{detail}</p>
                </div>
            </div>
        </div>
    );
}
