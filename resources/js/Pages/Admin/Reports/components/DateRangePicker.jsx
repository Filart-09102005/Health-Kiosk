import SharedDateRangePicker from "../../../../Global/DateRangePicker";
import TimeRangePicker from "../../../../Global/TimeRangePicker";

/**
 * Reports range control — a date range and a time-of-day range side by side.
 *
 * Both are the shared pickers, so this screen no longer carries its own date
 * or time inputs. Field names on `range` are unchanged, so the report queries
 * did not have to move.
 */
export default function DateRangePicker({ range, onRangeChange }) {
    return (
        <div
            className="grid w-full gap-4 rounded-2xl border p-4 shadow-sm xl:flex xl:items-end xl:gap-5"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
            <div className="min-w-0 xl:w-72">
                <SharedDateRangePicker
                    from={range.dateFrom}
                    to={range.dateTo}
                    label="Date range"
                    onApply={({ from, to }) => {
                        onRangeChange("dateFrom", from);
                        onRangeChange("dateTo", to);
                    }}
                />
            </div>

            <div className="min-w-0 xl:w-72">
                <TimeRangePicker
                    from={range.timeFrom}
                    to={range.timeTo}
                    label="Time of day"
                    onApply={({ from, to }) => {
                        onRangeChange("timeFrom", from);
                        onRangeChange("timeTo", to);
                    }}
                />
            </div>
        </div>
    );
}
