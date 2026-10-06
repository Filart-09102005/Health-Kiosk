import { FileText } from "lucide-react";

export default function ExportPDFButton() {
    return (
        <button className="flex items-center justify-center gap-2 rounded-[1rem] px-4 py-3 text-sm font-black transition hk-primary-hover" style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-content)" }}>
            <FileText size={16} />
            PDF
        </button>
    );
}
