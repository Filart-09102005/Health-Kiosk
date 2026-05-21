import { CalendarRange } from "lucide-react";

export default function DateRangePicker({ from, to, onFromChange, onToChange }) {
    return (
        <div>
            <span className="mb-1 block text-[0.65rem] font-black uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>Date range</span>
            <div className="flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                <CalendarRange size={15} style={{ color: "var(--color-primary)" }} />
                <input type="date" value={from} onChange={(e) => onFromChange(e.target.value)} className="bg-transparent text-xs font-bold outline-none" />
                <span className="text-xs font-black" style={{ color: "var(--color-muted)" }}>to</span>
                <input type="date" value={to} onChange={(e) => onToChange(e.target.value)} className="bg-transparent text-xs font-bold outline-none" />
            </div>
        </div>
    );
}
