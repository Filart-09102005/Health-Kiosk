import { Download } from "lucide-react";
import SectionHeader from "./SectionHeader";

const exports = ["Today's Health Report", "Weekly Summary", "Monthly Analytics", "Alert Reports", "BMI Reports", "Session Reports"];

export default function QuickExportPanel() {
    return (
        <section className="rounded-[14px] border p-5 shadow-xl" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <SectionHeader eyebrow="Quick export" title="Fast reporting actions" description="One-click demo export cards for common clinic reports." />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
                {exports.map((item) => (
                    <button key={item} className="flex items-center justify-between rounded-[14px] border p-4 text-left transition hk-admin-nav-hover" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                        <span className="font-black">{item}</span>
                        <Download size={17} style={{ color: "var(--color-primary)" }} />
                    </button>
                ))}
            </div>
        </section>
    );
}
