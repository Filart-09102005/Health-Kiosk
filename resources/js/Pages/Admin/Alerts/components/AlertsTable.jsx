import { useState } from "react";
import AlertTableRow from "./AlertTableRow";
import Pagination from "./Pagination";
import SectionHeader from "./SectionHeader";

const columns = ["Alert ID", "School ID", "Full Name", "Role", "Alert Type", "Original Measurement", "New Measurement", "Severity", "Status", "Session Status", "Triggered At", "Reviewed By", "Actions"];

export default function AlertsTable({ alerts = [], onView }) {
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 15;
    const totalRecords = alerts.length;
    const totalPages = Math.ceil(totalRecords / PAGE_SIZE);
    
    const activePage = Math.max(1, Math.min(currentPage, totalPages));
    const displayedAlerts = alerts.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

    return (
        <section className="rounded-[14px] border p-5 shadow-xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <SectionHeader title="Health alerts table" description="Abnormal readings, triage state, and clinic action controls." />
            </div>
            <div className="max-h-[34rem] overflow-auto rounded-[12px] border" style={{ borderColor: "var(--color-border)" }}>
                <table className="w-full min-w-[1180px] text-left text-sm">
                    <thead className="sticky top-0 z-10" style={{ backgroundColor: "var(--color-surface)", color: "var(--color-muted)" }}>
                        <tr>
                            {columns.map((column) => (
                                <th key={column} className="border-b px-3 py-3 font-black whitespace-nowrap" style={{ borderColor: "var(--color-border)" }}>
                                    {column}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {displayedAlerts.map((alert) => (
                            <AlertTableRow key={alert.id} alert={alert} onView={() => onView(alert)} />
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-4">
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
