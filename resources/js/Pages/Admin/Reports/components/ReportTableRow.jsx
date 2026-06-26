import { FileSpreadsheet, FileText, Printer } from "lucide-react";
import ReportStatusBadge from "./ReportStatusBadge";

export default function ReportTableRow({ report }) {
    return (
        <tr className="transition hover:bg-[color-mix(in_srgb,var(--color-text)_4%,transparent)]">
            <td className="border-b px-3 py-3 font-black" style={{ borderColor: "var(--color-border)" }}>
                <Truncate value={report.id} />
            </td>
            <td className="border-b px-3 py-3" style={{ borderColor: "var(--color-border)" }}>
                <p className="truncate font-black" title={report.name}>{report.name}</p>
                <p className="truncate text-[0.68rem] font-bold" style={{ color: "var(--color-muted)" }}>Generated report</p>
            </td>
            <td className="border-b px-3 py-3 font-bold" style={{ borderColor: "var(--color-border)" }}>
                <Truncate value={report.dateRange} />
            </td>
            <td className="border-b px-3 py-3 font-bold" style={{ borderColor: "var(--color-border)" }}>
                <Truncate value={report.generatedBy} />
            </td>
            <td className="border-b px-3 py-3 font-bold" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>
                <Truncate value={report.roleFilter} />
            </td>
            <td className="border-b px-3 py-3 font-bold" style={{ borderColor: "var(--color-border)" }}>
                <Truncate value={report.measurementType} />
            </td>
            <td className="border-b px-3 py-3 font-black" style={{ borderColor: "var(--color-border)" }}>
                {report.totalRecords}
            </td>
            <td className="border-b px-3 py-3 font-bold" style={{ borderColor: "var(--color-border)" }}>
                <Truncate value={report.generatedAt} />
            </td>
            <td className="border-b px-3 py-3" style={{ borderColor: "var(--color-border)" }}>
                <ReportStatusBadge status={report.status} />
            </td>
            <td className="border-b px-3 py-3" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex flex-col items-stretch gap-1.5">
                    <ActionButton title="Export report as Excel spreadsheet" label="Excel .xlsx" icon={FileSpreadsheet} />
                    <ActionButton title="Export report as PDF document" label="PDF .pdf" icon={FileText} />
                    <ActionButton title="Print report" label="Print" icon={Printer} />
                </div>
            </td>
        </tr>
    );
}

function Truncate({ value }) {
    return <span className="block truncate" title={String(value ?? "")}>{value}</span>;
}

function ActionButton({ title, label, icon: Icon }) {
    return (
        <button
            type="button"
            className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-[9px] border px-2.5 text-[0.68rem] font-black transition hk-admin-nav-hover"
            style={{ borderColor: "var(--color-border)" }}
            title={title}
        >
            <Icon size={14} />
            {label}
        </button>
    );
}
