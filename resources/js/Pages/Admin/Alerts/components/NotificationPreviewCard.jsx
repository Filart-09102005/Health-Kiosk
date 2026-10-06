import { BellRing } from "lucide-react";

export default function NotificationPreviewCard({ type, title, message }) {
    return (
        <article className="rounded-[1.25rem] border p-5 hk-admin-card transition hk-admin-nav-hover" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] border" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                    <BellRing size={18} style={{ color: "var(--color-primary)" }} />
                </div>
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--color-muted)" }}>{type}</p>
                    <h3 className="mt-1 font-black">{title}</h3>
                    <p className="mt-2 text-sm font-bold leading-6" style={{ color: "var(--color-muted)" }}>{message}</p>
                </div>
            </div>
        </article>
    );
}
