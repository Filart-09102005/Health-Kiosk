export default function Pagination({ currentPage, totalPages, totalRecords, pageSize, onPageChange }) {
    const startRecord = totalRecords ? (currentPage - 1) * pageSize + 1 : 0;
    const endRecord = Math.min(currentPage * pageSize, totalRecords);

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-bold" style={{ color: "var(--color-muted)" }}>Showing {startRecord}-{endRecord} of {totalRecords} reports</p>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="rounded-[10px] border px-3 py-2 text-xs font-black transition hk-admin-nav-hover disabled:cursor-not-allowed disabled:opacity-45"
                    style={{ backgroundColor: "var(--color-card)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
                >
                    Previous
                </button>
                <span className="rounded-[10px] border px-3 py-2 text-xs font-black" style={{ backgroundColor: "var(--color-text)", color: "var(--color-bg)", borderColor: "var(--color-border)" }}>
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="rounded-[10px] border px-3 py-2 text-xs font-black transition hk-admin-nav-hover disabled:cursor-not-allowed disabled:opacity-45"
                    style={{ backgroundColor: "var(--color-card)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
                >
                    Next
                </button>
            </div>
        </div>
    );
}
