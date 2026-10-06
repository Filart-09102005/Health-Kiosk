import { LayoutTemplate } from "lucide-react";

export default function ReportTemplateCard({ title, description }) {
    return (
        <article className="rounded-[1.25rem] border p-4 transition hk-admin-nav-hover" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="flex items-start gap-3">
                <LayoutTemplate size={18} style={{ color: "var(--color-primary)" }} />
                <div>
                    <p className="font-black">{title}</p>
                    <p className="mt-1 text-sm font-bold leading-6" style={{ color: "var(--color-muted)" }}>{description}</p>
                </div>
            </div>
        </article>
    );
}
