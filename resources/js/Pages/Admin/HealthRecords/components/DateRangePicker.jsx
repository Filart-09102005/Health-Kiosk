import { CalendarRange } from "lucide-react";

export default function DateRangePicker({ from, to, onFromChange, onToChange }) {
    return (
        <div className="min-w-0 xl:col-span-2">
            <span className="mb-1 block text-[0.65rem] font-black uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
                Date range
            </span>
            <div
                className="grid min-h-[44px] grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-[12px] border px-3 py-2"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
            >
                <span className="flex h-5 w-5 items-center justify-center rounded-md" style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, transparent)" }}>
                    <CalendarRange size={13} style={{ color: "var(--color-primary)" }} />
                </span>
                <input
                    type="date"
                    value={from}
                    onChange={(event) => onFromChange(event.target.value)}
                    className="min-w-0 bg-transparent text-xs font-bold outline-none"
                    style={{ color: "var(--color-text)" }}
                />
                <span className="text-xs font-black" style={{ color: "var(--color-muted)" }}>to</span>
                <input
                    type="date"
                    value={to}
                    onChange={(event) => onToChange(event.target.value)}
                    className="min-w-0 bg-transparent text-xs font-bold outline-none"
                    style={{ color: "var(--color-text)" }}
                />
            </div>
        </div>
    );
}
