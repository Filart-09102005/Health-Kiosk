import { FileText } from "lucide-react";

export default function ExportPDFButton() {
    return (
        <button className="flex items-center justify-center gap-2 rounded-[12px] px-4 py-3 text-sm font-black text-white transition hk-primary-hover" style={{ backgroundColor: "var(--color-primary)" }}>
            <FileText size={16} />
            PDF
        </button>
    );
}
