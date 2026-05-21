import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, totalPages, onPageChange }) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold" style={{ color: "var(--color-muted)" }}>
                Page {page} of {totalPages}
            </p>
            <div
                className="inline-flex items-center gap-1 rounded-xl border p-1"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
            >
                <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition hk-soft-hover disabled:opacity-40"
                    aria-label="Previous page"
                >
                    <ChevronLeft size={16} />
                </button>
                <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition hk-soft-hover disabled:opacity-40"
                    aria-label="Next page"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}
