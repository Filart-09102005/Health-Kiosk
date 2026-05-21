export default function Pagination() {
    return (
        <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--color-border)" }}>
            <p className="text-sm font-bold" style={{ color: "var(--color-muted)" }}>Showing 1-4 of 24 alerts</p>
            <div className="flex gap-2">
                {["Prev", "1", "2", "Next"].map((item) => (
                    <button key={item} className="rounded-[10px] border px-3 py-2 text-xs font-black transition hk-admin-nav-hover" style={{ borderColor: "var(--color-border)", backgroundColor: item === "1" ? "var(--color-surface)" : "var(--color-card)" }}>
                        {item}
                    </button>
                ))}
            </div>
        </div>
    );
}
