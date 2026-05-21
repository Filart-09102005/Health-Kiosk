import { CalendarDays } from "lucide-react";

export default function DateRangePicker() {
    return (
        <button className="flex h-11 items-center gap-2 rounded-[12px] border px-3 text-sm font-black transition hk-admin-nav-hover" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <CalendarDays size={17} />
            Today
        </button>
    );
}
