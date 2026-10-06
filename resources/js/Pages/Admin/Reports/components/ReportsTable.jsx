import { useMemo, useState } from "react";
import Pagination from "../../../../Global/TablePagination";
import ReportTableRow from "./ReportTableRow";
import SectionHeader from "./SectionHeader";
import { Table, Sparkles } from "lucide-react";

const PAGE_SIZE = 15;

export default function ReportsTable({ reports = [], onPreview, filters, range }) {
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(reports.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);

    const visibleReports = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return reports.slice(start, start + PAGE_SIZE);
    }, [currentPage, reports]);

    return (
        <section
            className="rounded-3xl border p-6 shadow-2xl space-y-4"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-lg font-black flex items-center gap-2" style={{ color: "var(--color-text)" }}>
                        <Table size={18} style={{ color: "var(--color-primary)" }} />
                        Generated Clinic Reports
                        <Sparkles size={14} style={{ color: "var(--color-primary)" }} />
                    </h3>
                    <p className="mt-0.5 text-xs font-semibold" style={{ color: "var(--color-muted)" }}>
                        Select any report row below to export formatted PDF or Excel summaries for your clinic records.
                    </p>
                </div>
                <span className="rounded-full px-3 py-1 text-xs font-black self-start sm:self-auto border" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-primary)" }}>
                    {reports.length} Reports Ready
                </span>
            </div>

            <div className="overflow-hidden rounded-2xl border shadow-sm" style={{ borderColor: "var(--color-border)" }}>
                <div className="overflow-x-auto">
                    <table className="hk-table w-full min-w-[800px] text-xs">
                        <thead>
                            <tr>
                                <th className="w-[18rem]">Report Name</th>
                                <th className="">Description</th>
                                <th className="w-[14rem]">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleReports.map((report) => (
                                <ReportTableRow
                                    key={report.id}
                                    report={report}
                                    onPreview={onPreview}
                                    filters={filters}
                                    range={range}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {totalPages > 1 && (
                <div className="pt-2">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalRecords={reports.length}
                        pageSize={PAGE_SIZE}
                        onPageChange={setPage}
                    />
                </div>
            )}
        </section>
    );
}
