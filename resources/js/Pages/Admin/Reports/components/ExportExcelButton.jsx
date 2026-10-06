import { FileSpreadsheet } from "lucide-react";

export default function ExportExcelButton() {
    return (
        <button className="flex items-center justify-center gap-2 rounded-[1rem] border px-4 py-3 text-sm font-black transition hk-admin-nav-hover" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <FileSpreadsheet size={16} />
            Excel
        </button>
    );
}
