import { Download } from "lucide-react";

export default function ExportAlertsButton() {
    return (
        <button className="flex h-11 items-center gap-2 rounded-[12px] border px-3 text-sm font-black transition hk-admin-nav-hover" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <Download size={17} />
            Export
        </button>
    );
}
