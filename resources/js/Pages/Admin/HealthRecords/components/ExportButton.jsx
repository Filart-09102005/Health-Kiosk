import { FileDown } from "lucide-react";

export default function ExportButton({ label = "Export" }) {
    return (
        <button
            type="button"
            className="inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-xs font-black transition hk-soft-hover"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
            <FileDown size={14} />
            {label}
        </button>
    );
}
