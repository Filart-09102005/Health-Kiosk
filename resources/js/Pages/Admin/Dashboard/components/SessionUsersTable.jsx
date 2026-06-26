import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cardClassName, cardStyle } from "../utils/surface";
import StatusBadge from "./StatusBadge";

const PAGE_SIZE = 15;

export default function SessionUsersTable({ records = [] }) {
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
    const pageStart = (page - 1) * PAGE_SIZE;
    const visibleRecords = useMemo(() => records.slice(pageStart, pageStart + PAGE_SIZE), [pageStart, records]);

    useEffect(() => {
        setPage((current) => Math.min(current, totalPages));
    }, [totalPages]);

    return (
        <article className={`${cardClassName} overflow-hidden p-5`} style={cardStyle}>
            <div className="mb-4">
                <h3 className="text-sm font-black">Session Users</h3>
                <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>
                    Users included in today's kiosk completion count.
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                    <thead>
                        <tr style={{ color: "var(--color-muted)" }}>
                            {["School ID", "User", "Started", "Status"].map((heading) => (
                                <th
                                    key={heading}
                                    className="border-b px-3 py-3 text-xs font-black uppercase tracking-wide"
                                    style={{ borderColor: "var(--color-border)" }}
                                >
                                    {heading}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {visibleRecords.map((row) => (
                            <tr key={row.id} className="transition hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,transparent)]">
                                <td className="border-b px-3 py-4 font-black" style={{ borderColor: "var(--color-border)" }}>
                                    {row.schoolId}
                                </td>
                                <td className="border-b px-3 py-4" style={{ borderColor: "var(--color-border)" }}>
                                    {row.user}
                                </td>
                                <td className="border-b px-3 py-4 text-xs font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>
                                    {row.started}
                                </td>
                                <td className="border-b px-3 py-4" style={{ borderColor: "var(--color-border)" }}>
                                    <StatusBadge label={row.status} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="-mx-5 -mb-5 mt-5 border-t px-5 py-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-black" style={{ color: "var(--color-muted)" }}>
                        Showing {visibleRecords.length ? pageStart + 1 : 0}-{Math.min(pageStart + PAGE_SIZE, records.length)} of {records.length} sessions
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => setPage((current) => Math.max(1, current - 1))}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border transition hk-soft-hover disabled:cursor-not-allowed disabled:opacity-40"
                            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
                            aria-label="Previous session users page"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="rounded-xl border px-3 py-2 text-xs font-black" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
                            Page {page} of {totalPages}
                        </span>
                        <button
                            type="button"
                            disabled={page >= totalPages}
                            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border transition hk-soft-hover disabled:cursor-not-allowed disabled:opacity-40"
                            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
                            aria-label="Next session users page"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
}
