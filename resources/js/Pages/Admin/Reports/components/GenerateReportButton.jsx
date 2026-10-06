import { Sparkles } from "lucide-react";

export default function GenerateReportButton({ onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition-all shadow-md hk-primary-hover hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-content)" }}
        >
            <Sparkles size={16} />
            <span>Generate report</span>
        </button>
    );
}
