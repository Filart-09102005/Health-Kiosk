import { CalendarRange } from "lucide-react";

export default function DateRangePicker({ range, onRangeChange }) {
    const fieldClass = "h-11 min-w-0 rounded-[12px] border px-3 text-sm font-black outline-none";
    const fieldStyle = {
        backgroundColor: "var(--color-card)",
        borderColor: "var(--color-border)",
        color: "var(--color-text)",
    };

    return (
        <div className="grid gap-3 rounded-[14px] border p-3 lg:grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="flex shrink-0 items-center gap-2 text-sm font-black" style={{ color: "var(--color-muted)" }}>
                <CalendarRange size={16} />
                From
            </div>
            <div className="grid min-w-0 gap-2 sm:grid-cols-2">
                <input
                    type="date"
                    value={range.dateFrom}
                    onChange={(event) => onRangeChange("dateFrom", event.target.value)}
                    className={fieldClass}
                    style={fieldStyle}
                />
                <input
                    type="time"
                    value={range.timeFrom}
                    onChange={(event) => onRangeChange("timeFrom", event.target.value)}
                    className={fieldClass}
                    style={fieldStyle}
                />
            </div>
            <div className="flex shrink-0 items-center text-sm font-black" style={{ color: "var(--color-muted)" }}>
                To
            </div>
            <div className="grid min-w-0 gap-2 sm:grid-cols-2">
                <input
                    type="date"
                    value={range.dateTo}
                    onChange={(event) => onRangeChange("dateTo", event.target.value)}
                    className={fieldClass}
                    style={fieldStyle}
                />
                <input
                    type="time"
                    value={range.timeTo}
                    onChange={(event) => onRangeChange("timeTo", event.target.value)}
                    className={fieldClass}
                    style={fieldStyle}
                />
            </div>
        </div>
    );
}
