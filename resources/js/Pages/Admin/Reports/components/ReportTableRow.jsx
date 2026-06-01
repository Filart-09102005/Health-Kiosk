import { FileSpreadsheet, FileText } from "lucide-react";
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
            <td className="border-b px-3 py-3 font-black" style={{ borderColor: "var(--color-border)" }}>
                {report.format}
            </td>
            <td className="border-b px-3 py-3 font-bold" style={{ borderColor: "var(--color-border)" }}>
                <Truncate value={report.generatedAt} />
            </td>
            <td className="border-b px-3 py-3" style={{ borderColor: "var(--color-border)" }}>
                <ReportStatusBadge status={report.status} />
            </td>
            <td className="border-b px-3 py-3" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex items-center gap-1.5">
                    <ActionButton title="Export Excel" label="Excel" icon={FileSpreadsheet} />
                    <ActionButton title="Export PDF" label="PDF" icon={FileText} />
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
            className="flex h-8 items-center gap-1.5 rounded-[9px] border px-2.5 text-[0.68rem] font-black transition hk-admin-nav-hover"
            style={{ borderColor: "var(--color-border)" }}
            title={title}
        >
            <Icon size={14} />
            {label}
        </button>
    );
}
