import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, totalPages, onPageChange }) {
    const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-black" style={{ color: "var(--color-muted)" }}>
                Page {page} of {totalPages}
            </p>
            <div className="flex flex-wrap items-center justify-end gap-1.5">
                <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border transition hk-soft-hover disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                    aria-label="Previous page"
                >
                    <ChevronLeft size={16} />
                </button>
                {pages.map((item) => (
                    <button
                        key={item}
                        type="button"
                        onClick={() => onPageChange(item)}
                        className="h-9 min-w-9 rounded-xl border px-3 text-xs font-black transition hk-soft-hover"
                        style={{
                            borderColor: item === page ? "var(--color-primary)" : "var(--color-border)",
                            backgroundColor: item === page ? "var(--color-primary)" : "var(--color-surface)",
                            color: item === page ? "#ffffff" : "var(--color-text)",
                        }}
                    >
                        {item}
                    </button>
                ))}
                <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border transition hk-soft-hover disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                    aria-label="Next page"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}
