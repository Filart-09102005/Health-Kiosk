import { FileText } from "lucide-react";
import ReportStatusBadge from "./ReportStatusBadge";

export default function ReportSummaryCard({ report }) {
    return (
        <div className="rounded-[14px] border p-4" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[12px] border" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                        <FileText size={18} style={{ color: "var(--color-primary)" }} />
                    </div>
                    <div>
                        <p className="font-black">{report.name}</p>
                        <p className="mt-1 text-sm font-bold" style={{ color: "var(--color-muted)" }}>{report.id} - {report.dateRange}</p>
                    </div>
                </div>
                <ReportStatusBadge status={report.status} />
            </div>
        </div>
    );
}
