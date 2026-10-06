import SharedDateRangePicker from "../../../../Global/DateRangePicker";

/**
 * Adapter over the shared range picker.
 *
 * This screen keeps `from` and `to` as separate pieces of state with their own
 * setters, so both are applied together here rather than reshaping the caller.
 */
export default function DateRangePicker({ from, to, onFromChange, onToChange }) {
    return (
        <div className="min-w-0 xl:col-span-2">
            <SharedDateRangePicker
                from={from}
                to={to}
                label="Date range"
                onApply={({ from: nextFrom, to: nextTo }) => {
                    onFromChange(nextFrom);
                    onToChange(nextTo);
                }}
            />
        </div>
    );
}
