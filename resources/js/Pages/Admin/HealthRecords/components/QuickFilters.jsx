const filters = [
    { key: "all", label: "All records" },
    { key: "alerts", label: "Alerts" },
    { key: "incomplete", label: "Incomplete" },
    { key: "completed", label: "Completed" },
    { key: "today", label: "Today" },
];

export default function QuickFilters({ active, onChange }) {
    return (
        <div className="flex flex-wrap gap-2 rounded-2xl border p-1.5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            {filters.map((filter) => {
                const isActive = active === filter.key;

                return (
                    <button
                        key={filter.key}
                        type="button"
                        onClick={() => onChange(filter.key)}
                        className="rounded-xl px-3 py-2 text-xs font-black transition"
                        style={{
                            backgroundColor: isActive ? "var(--color-primary)" : "transparent",
                            color: isActive ? "#fff" : "var(--color-muted)",
                            border: "1px solid transparent",
                        }}
                    >
                        {filter.label}
                    </button>
                );
            })}
        </div>
    );
}
