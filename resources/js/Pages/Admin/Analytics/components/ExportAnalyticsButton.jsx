import { FileDown } from "lucide-react";

export default function ExportAnalyticsButton({ label = "Export analytics" }) {
    return (
        <button type="button" className="inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-black transition hk-soft-hover" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <FileDown size={14} />
            {label}
        </button>
    );
}
