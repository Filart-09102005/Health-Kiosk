import { RefreshCw } from "lucide-react";

export default function GenerateReportButton({ onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex items-center justify-center gap-2 rounded-[12px] px-4 py-3 text-sm font-black text-white transition hk-primary-hover"
            style={{ backgroundColor: "var(--color-primary)" }}
        >
            <RefreshCw size={16} />
            Generate report
        </button>
    );
}
