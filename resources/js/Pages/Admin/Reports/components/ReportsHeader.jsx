import { FileText } from "lucide-react";

export default function ReportsHeader() {
    return (
        <section
            className="rounded-[14px] border p-6 shadow-xl"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
            <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-[14px] border" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                    <FileText size={24} style={{ color: "var(--color-primary)" }} />
                </div>
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-primary)" }}>Admin / Reports</p>
                    <h1 className="mt-2 text-4xl font-black tracking-tight">Clinic Reports</h1>
                    <p className="mt-2 max-w-3xl text-sm font-bold leading-6" style={{ color: "var(--color-muted)" }}>
                        Generate report data from a selected date and time range.
                    </p>
                </div>
            </div>
        </section>
    );
}
