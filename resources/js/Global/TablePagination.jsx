import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

/**
 * The one pagination used by every table.
 *
 * There were four near-identical copies of this with two different prop
 * shapes, so it accepts both: `page` or `currentPage` for the current index,
 * and an optional `totalRecords` + `pageSize` pair to show an exact range
 * instead of just the page number.
 */
export default function TablePagination({
    page,
    currentPage,
    totalPages,
    totalRecords,
    pageSize,
    onPageChange,
    noun = "record",
}) {
    const shouldReduceMotion = useReducedMotion();
    // Scoped so two tables on one screen don't trade pills between them.
    const pillId = useId();

    const active = page ?? currentPage ?? 1;
    if (!totalPages || totalPages <= 0) return null;

    const items = buildItems(active, totalPages);

    const hasRange = Number.isFinite(totalRecords) && Number.isFinite(pageSize) && pageSize > 0;
    const from = hasRange ? (totalRecords === 0 ? 0 : (active - 1) * pageSize + 1) : null;
    const to = hasRange ? Math.min(active * pageSize, totalRecords) : null;

    return (
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold" style={{ color: "var(--color-muted)" }}>
                {hasRange ? (
                    <>
                        Showing{" "}
                        <span className="font-black tabular-nums" style={{ color: "var(--color-text)" }}>{from}–{to}</span>
                        {" "}of{" "}
                        <span className="font-black tabular-nums" style={{ color: "var(--color-text)" }}>{totalRecords}</span>
                        {" "}{totalRecords === 1 ? noun : `${noun}s`}
                    </>
                ) : (
                    <>
                        Page{" "}
                        <span className="font-black tabular-nums" style={{ color: "var(--color-text)" }}>{active}</span>
                        {" "}of{" "}
                        <span className="font-black tabular-nums" style={{ color: "var(--color-text)" }}>{totalPages}</span>
                    </>
                )}
            </p>

            <nav className="flex flex-wrap items-center justify-end gap-1.5" aria-label="Pagination">
                <StepButton
                    onClick={() => onPageChange(active - 1)}
                    disabled={active <= 1}
                    label="Previous page"
                >
                    <ChevronLeft size={16} strokeWidth={2.5} />
                </StepButton>

                {items.map((item, index) => {
                    if (item === "...") {
                        return (
                            <span key={`gap-${index}`} className="flex h-9 w-9 items-center justify-center" aria-hidden="true">
                                <MoreHorizontal size={16} strokeWidth={2.5} style={{ color: "var(--color-muted)" }} />
                            </span>
                        );
                    }

                    const isActive = item === active;

                    return (
                        <button
                            key={`page-${item}`}
                            type="button"
                            onClick={() => onPageChange(item)}
                            className="relative flex h-9 min-w-9 items-center justify-center rounded-xl border px-3 text-xs font-black transition-colors hk-soft-hover"
                            style={{
                                borderColor: isActive ? "transparent" : "var(--color-border)",
                                backgroundColor: isActive ? "transparent" : "var(--color-surface)",
                                color: isActive ? "#ffffff" : "var(--color-text)",
                            }}
                            aria-label={isActive ? `Current page ${item}` : `Page ${item}`}
                            aria-current={isActive ? "page" : undefined}
                        >
                            {/* One pill that slides between pages rather than the
                                highlight blinking from one number to the next. */}
                            {isActive ? (
                                <motion.span
                                    layoutId={`table-pagination-pill-${pillId}`}
                                    className="absolute inset-0 rounded-xl"
                                    style={{
                                        backgroundColor: "var(--color-primary)",
                                        boxShadow: "0 6px 16px -6px color-mix(in srgb, var(--color-primary) 80%, transparent)",
                                    }}
                                    transition={shouldReduceMotion
                                        ? { duration: 0.01 }
                                        : { type: "spring", stiffness: 460, damping: 36 }}
                                />
                            ) : null}
                            <span className="relative z-10 tabular-nums">{item}</span>
                        </button>
                    );
                })}

                <StepButton
                    onClick={() => onPageChange(active + 1)}
                    disabled={active >= totalPages}
                    label="Next page"
                >
                    <ChevronRight size={16} strokeWidth={2.5} />
                </StepButton>
            </nav>
        </div>
    );
}

/** Condense long ranges to first / neighbours / last with ellipses. */
function buildItems(active, totalPages) {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (active <= 3) return [1, 2, 3, 4, "...", totalPages];
    if (active >= totalPages - 2) return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", active - 1, active, active + 1, "...", totalPages];
}

function StepButton({ onClick, disabled, label, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            className="flex h-9 w-9 items-center justify-center rounded-xl border transition hk-soft-hover disabled:cursor-not-allowed disabled:opacity-40"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
        >
            {children}
        </button>
    );
}
