import { motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";

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
    children,
}) {
    return (
        <div className="mt-5 space-y-5">
            <motion.section
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[14px] border p-5 shadow-xl"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
            >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                        {Icon ? (
                            <div
                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px]"
                                style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
                            >
                                    <Icon size={23} />
                            </div>
                        ) : null}
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-muted)" }}>
                                {eyebrow}
                            </p>
                            <h2 className="mt-2 text-3xl font-black">{title}</h2>
                            <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: "var(--color-muted)" }}>
                                {description}
                            </p>
                        </div>
                    </div>

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
                </div>
            </motion.section>

            {stats.length ? (
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {stats.map((stat, index) => {
                        const StatIcon = stat.icon;

                        return (
                            <motion.article
                                key={stat.label}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.04 }}
                                className="rounded-[14px] border p-5 shadow-sm"
                                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-bold" style={{ color: "var(--color-muted)" }}>{stat.label}</p>
                                        <p className="mt-2 text-3xl font-black">{stat.value}</p>
                                    </div>
                                    {StatIcon ? (
                                        <div
                                            className="flex h-10 w-10 items-center justify-center rounded-[10px]"
                                            style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
                                        >
                                            <StatIcon size={22} />
                                        </div>
                                    ) : null}
                                </div>
                                {stat.caption ? (
                                    <p className="mt-4 text-xs font-bold" style={{ color: "var(--color-muted)" }}>{stat.caption}</p>
                                ) : null}
                            </motion.article>
                        );
                    })}
                </section>
            ) : null}

            {children}

            {columns.length && rows.length ? (
                <section className="rounded-[14px] border p-5 shadow-xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
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
                                {rows.map((row, rowIndex) => (
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
                </section>
            ) : null}
        </div>
    );
}
