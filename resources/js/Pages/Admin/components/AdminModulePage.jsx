import { motion, useReducedMotion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import TablePagination from "../../../Global/TablePagination";

const statusColor = (status) => {
    const normalized = String(status || "").toLowerCase();

    if (["normal", "online", "active", "ready", "verified", "completed", "success"].includes(normalized)) {
        return "var(--color-success)";
    }

    if (["alert", "critical", "offline", "failed", "blocked"].includes(normalized)) {
        return "var(--color-error)";
    }

    if (["watch", "pending", "maintenance", "queued", "draft"].includes(normalized)) {
        return "var(--color-primary)";
    }

    return "var(--color-muted)";
};

export default function AdminModulePage({
    icon: Icon,
    eyebrow,
    title,
    description,
    stats = [],
    columns = [],
    rows = [],
    filters = ["Today", "This week", "All"],
    showHeaderActions = true,
    tablePageSize = 15,
    children,
}) {
    const shouldReduceMotion = useReducedMotion();
    const [currentPage, setCurrentPage] = useState(1);

    const hasPagedTable = Boolean(tablePageSize && rows.length > tablePageSize);
    const totalPages = hasPagedTable ? Math.ceil(rows.length / tablePageSize) : 1;

    const visibleRows = useMemo(() => {
        if (!hasPagedTable) {
            return rows;
        }

        const start = (currentPage - 1) * tablePageSize;
        return rows.slice(start, start + tablePageSize);
    }, [currentPage, hasPagedTable, rows, tablePageSize]);

    useEffect(() => {
        setCurrentPage(1);
    }, [rows, tablePageSize]);

    return (
        <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 0.24, ease: "easeOut" }}
            className="mt-5 space-y-5"
        >
            <motion.section
                initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={shouldReduceMotion ? { duration: 0.01 } : { delay: 0.04, duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
                transformTemplate={(_, generated) => `${generated} translateZ(0)`}
                className="relative transform-gpu overflow-hidden rounded-[1.5rem] border p-6 shadow-sm"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", willChange: "transform, opacity" }}
            >
                {/* Soft accent wash so the page banner reads as a header rather
                    than another flat card in the stack. */}
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full"
                    style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--color-primary) 13%, transparent), transparent 70%)" }}
                />

                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                        {Icon ? (
                            <div
                                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                                style={{
                                    backgroundColor: "color-mix(in srgb, var(--color-primary) 11%, transparent)",
                                    color: "var(--color-primary)",
                                }}
                            >
                                <Icon size={24} />
                            </div>
                        ) : null}
                        <div className="min-w-0">
                            <p className="text-[0.65rem] font-black uppercase tracking-[0.2em]" style={{ color: "var(--color-primary)" }}>
                                {eyebrow}
                            </p>
                            <h2 className="mt-1.5 text-3xl font-black tracking-tight">{title}</h2>
                            <p className="mt-2 max-w-2xl text-sm font-medium leading-6" style={{ color: "var(--color-muted)" }}>
                                {description}
                            </p>
                        </div>
                    </div>

                    {showHeaderActions ? (
                        <div className="flex flex-wrap items-center gap-3">
                            <div
                                className="flex h-11 items-center gap-2 rounded-xl border px-3"
                                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-muted)" }}
                            >
                                <Search size={17} />
                                <span className="text-sm font-bold">Search records</span>
                            </div>
                            <button
                                type="button"
                                className="flex h-11 items-center gap-2 rounded-xl border px-3 text-sm font-black transition hk-admin-nav-hover"
                                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                            >
                                <SlidersHorizontal size={17} />
                                Filters
                            </button>
                        </div>
                    ) : null}
                </div>
            </motion.section>

            {stats.length ? (
                <motion.section
                    className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
                    initial="hidden"
                    animate="show"
                    layout={false}
                    variants={{
                        hidden: {},
                        show: {
                            // Was delayChildren 0.52 with content at 0.92s — a
                            // near-second wait on every navigation, which reads
                            // as sluggish rather than considered.
                            transition: shouldReduceMotion
                                ? { staggerChildren: 0 }
                                : { delayChildren: 0.12, staggerChildren: 0.05 },
                        },
                    }}
                >
                    {stats.map((stat, index) => {
                        const StatIcon = stat.icon;

                        return (
                            <motion.article
                                key={stat.label}
                                layout={false}
                                variants={{
                                    hidden: shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
                                    show: {
                                        opacity: 1,
                                        y: 0,
                                        transition: shouldReduceMotion
                                            ? { duration: 0.01 }
                                            : { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
                                    },
                                    exit: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 },
                                }}
                                transformTemplate={(_, generated) => `${generated} translateZ(0)`}
                                className="hk-stat-card group transform-gpu rounded-[1.25rem] border p-5"
                                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", willChange: "transform, opacity" }}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <p className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--color-muted)" }}>
                                        {stat.label}
                                    </p>
                                    {StatIcon ? (
                                        <div
                                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors"
                                            style={{
                                                backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, transparent)",
                                                color: "var(--color-primary)",
                                            }}
                                        >
                                            <StatIcon size={18} />
                                        </div>
                                    ) : null}
                                </div>

                                <p className="mt-3 text-4xl font-black tabular-nums tracking-tight">{stat.value}</p>

                                {stat.caption ? (
                                    <p className="mt-2 text-xs font-semibold" style={{ color: "var(--color-muted)" }}>{stat.caption}</p>
                                ) : null}
                            </motion.article>
                        );
                    })}
                </motion.section>
            ) : null}

            {children ? (
                <motion.div
                    initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={shouldReduceMotion ? { duration: 0.01 } : { delay: stats.length ? 0.3 : 0.14, duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                >
                    {children}
                </motion.div>
            ) : null}

            {columns.length && rows.length ? (
                <section className="rounded-[1.25rem] border p-5 hk-admin-card" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="text-lg font-black">Records</h3>
                            <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
                                Server-ready table layout with search, filters, and pagination space.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {filters.map((filter) => (
                                <button
                                    key={filter}
                                    type="button"
                                    className="rounded-xl border px-3 py-2 text-xs font-black transition hk-admin-nav-hover"
                                    style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                            <thead>
                                <tr style={{ color: "var(--color-muted)" }}>
                                    {columns.map((column) => (
                                        <th key={column} className="border-b px-3 py-3 font-black" style={{ borderColor: "var(--color-border)" }}>
                                            {column}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {visibleRows.map((row, rowIndex) => (
                                    <tr key={row.id || rowIndex}>
                                        {columns.map((column) => {
                                            const value = row[column] ?? row[column.toLowerCase().replaceAll(" ", "_")];
                                            const isStatus = column.toLowerCase().includes("status") || column.toLowerCase().includes("state");

                                            return (
                                                <td key={column} className="border-b px-3 py-4 font-bold" style={{ borderColor: "var(--color-border)", color: isStatus ? statusColor(value) : "inherit" }}>
                                                    {isStatus ? (
                                                        <span
                                                            className="rounded-full px-3 py-1 text-xs font-black"
                                                            style={{
                                                                color: statusColor(value),
                                                                backgroundColor: "color-mix(in srgb, currentColor 10%, transparent)",
                                                            }}
                                                        >
                                                            {value}
                                                        </span>
                                                    ) : value}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {hasPagedTable ? (
                        <div className="mt-4 border-t pt-4" style={{ borderColor: "var(--color-border)" }}>
                            <TablePagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalRecords={rows.length}
                                pageSize={tablePageSize}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    ) : null}
                </section>
            ) : null}
        </motion.div>
    );
}
