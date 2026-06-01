export default function Pagination({ currentPage, totalPages, totalRecords, pageSize, onPageChange }) {
    if (totalPages <= 1) return null;

    const startRecord = (currentPage - 1) * pageSize + 1;
    const endRecord = Math.min(currentPage * pageSize, totalRecords);

    return (
        <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--color-border)" }}>
            <p className="text-sm font-bold" style={{ color: "var(--color-muted)" }}>
                Showing {startRecord}-{endRecord} of {totalRecords} alerts
            </p>
            <div className="flex flex-wrap gap-2">
                <button
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="rounded-[10px] border px-3 py-2 text-xs font-black transition disabled:opacity-40"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
                >
                    Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((item) => (
                    <button
                        key={item}
                        onClick={() => onPageChange(item)}
                        className="rounded-[10px] border px-3 py-2 text-xs font-black transition"
                        style={{
                            borderColor: "var(--color-border)",
                            backgroundColor: item === currentPage ? "var(--color-surface)" : "var(--color-card)"
                        }}
                    >
                        {item}
                    </button>
                ))}
                <button
                    disabled={currentPage >= totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="rounded-[10px] border px-3 py-2 text-xs font-black transition disabled:opacity-40"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
                >
                    Next
                </button>
            </div>
        </div>
    );
}
