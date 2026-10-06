import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import AlertTableRow from "./AlertTableRow";
import Pagination from "../../../../Global/TablePagination";

const columns = [
    "Alert ID",
    "Person",
    "Role",
    "Alert Type",
    "Original",
    "New",
    "Severity",
    "Status",
    "Session",
    "Triggered At",
    "Reviewed By",
    "",
];

export default function AlertsTable({ alerts = [], onView }) {
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 15;
    const totalRecords = alerts.length;
    const totalPages = Math.ceil(totalRecords / PAGE_SIZE);

    const activePage = Math.max(1, Math.min(currentPage, totalPages));
    const displayedAlerts = alerts.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

    return (
        <section
            className="overflow-hidden rounded-[1.5rem] border hk-admin-card"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
            {/* Header strip, flush with the table below it — the old version
                nested a bordered box inside a padded card, which read as two
                competing frames. */}
            <div
                className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                style={{ borderColor: "var(--color-border)" }}
            >
                <div className="flex min-w-0 items-center gap-3">
                    <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{
                            backgroundColor: "color-mix(in srgb, var(--color-error) 11%, transparent)",
                            color: "var(--color-error)",
                        }}
                    >
                        <ShieldAlert size={18} />
                    </span>
                    <div className="min-w-0">
                        <h3 className="text-base font-black tracking-tight" style={{ color: "var(--color-text)" }}>
                            Health alerts table
                        </h3>
                        <p className="mt-0.5 text-xs font-semibold" style={{ color: "var(--color-muted)" }}>
                            Abnormal readings, triage state, and clinic action controls.
                        </p>
                    </div>
                </div>

                <span
                    className="hk-pill shrink-0 self-start sm:self-auto"
                    style={{
                        backgroundColor: "color-mix(in srgb, var(--color-primary) 11%, transparent)",
                        color: "var(--color-primary)",
                    }}
                >
                    {totalRecords} {totalRecords === 1 ? "alert" : "alerts"}
                </span>
            </div>

            <div className="hk-slim-scroll max-h-[34rem] overflow-auto">
                <table className="hk-table w-full min-w-[1180px] text-sm">
                    <thead>
                        <tr>
                            {columns.map((column, index) => (
                                <th key={column || `col-${index}`} className="whitespace-nowrap">
                                    {column}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {displayedAlerts.length ? displayedAlerts.map((alert) => (
                            <AlertTableRow key={alert.id} alert={alert} onView={() => onView(alert)} />
                        )) : (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-14 text-center">
                                    <div
                                        className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
                                        style={{ backgroundColor: "var(--color-surface)", color: "var(--color-muted)" }}
                                    >
                                        <ShieldAlert size={24} />
                                    </div>
                                    <p className="text-sm font-black" style={{ color: "var(--color-text)" }}>No alerts to show</p>
                                    <p className="mt-1 text-xs font-semibold" style={{ color: "var(--color-muted)" }}>
                                        Nothing matches the current filters.
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="border-t px-5 py-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <Pagination
                    currentPage={activePage}
                    totalPages={totalPages}
                    totalRecords={totalRecords}
                    pageSize={PAGE_SIZE}
                    onPageChange={setCurrentPage}
                />
            </div>
        </section>
    );
}
