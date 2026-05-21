import { CalendarRange } from "lucide-react";

export default function DateRangePicker() {
    return (
        <button className="flex items-center gap-2 rounded-[12px] border px-4 py-3 text-sm font-black transition hk-admin-nav-hover" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <CalendarRange size={16} />
            This month
        </button>
    );
}
