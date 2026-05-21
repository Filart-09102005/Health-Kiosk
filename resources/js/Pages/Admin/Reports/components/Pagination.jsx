export default function Pagination() {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-bold" style={{ color: "var(--color-muted)" }}>Showing 1-4 of 148 reports</p>
            <div className="flex items-center gap-2">
                {["Previous", "1", "2", "Next"].map((label) => (
                    <button key={label} className="rounded-[10px] border px-3 py-2 text-xs font-black transition hk-admin-nav-hover" style={{ backgroundColor: label === "1" ? "var(--color-text)" : "var(--color-card)", color: label === "1" ? "var(--color-bg)" : "var(--color-text)", borderColor: "var(--color-border)" }}>
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );
}
