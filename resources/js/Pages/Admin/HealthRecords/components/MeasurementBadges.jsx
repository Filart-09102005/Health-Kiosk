export default function MeasurementBadges({ completed, total }) {
    const percent = Math.round((completed / total) * 100);

    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs font-black">{completed}/{total} modules</span>
            <div className="h-1.5 w-24 overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-surface)" }}>
                <span
                    className="block h-full rounded-full transition-all"
                    style={{
                        width: `${percent}%`,
                        backgroundColor: percent === 100 ? "var(--color-success)" : "var(--color-primary)",
                    }}
                />
            </div>
        </div>
    );
}
