import DateRangePicker from "./DateRangePicker";

export default function ReportsFilters({ range, onRangeChange }) {
    return (
        <div className="min-w-0 flex-1">
            <DateRangePicker range={range} onRangeChange={onRangeChange} />
        </div>
    );
}
