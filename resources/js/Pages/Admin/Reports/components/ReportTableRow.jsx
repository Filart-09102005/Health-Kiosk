import { Download, Eye, MoreHorizontal, Printer } from "lucide-react";
import ReportStatusBadge from "./ReportStatusBadge";

export default function ReportTableRow({ report, onPreview }) {
    return (
        <tr className="transition hover:bg-[color-mix(in_srgb,var(--color-text)_4%,transparent)]">
            <td className="border-b px-3 py-4 font-black" style={{ borderColor: "var(--color-border)" }}>{report.id}</td>
            <td className="border-b px-3 py-4" style={{ borderColor: "var(--color-border)" }}>
                <p className="font-black">{report.name}</p>
                <p className="text-xs font-bold" style={{ color: "var(--color-muted)" }}>Healthcare reporting template</p>
            </td>
            <td className="border-b px-3 py-4 font-bold" style={{ borderColor: "var(--color-border)" }}>{report.dateRange}</td>
            <td className="border-b px-3 py-4 font-bold" style={{ borderColor: "var(--color-border)" }}>{report.generatedBy}</td>
            <td className="border-b px-3 py-4 font-bold" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>{report.roleFilter}</td>
            <td className="border-b px-3 py-4 font-bold" style={{ borderColor: "var(--color-border)" }}>{report.measurementType}</td>
            <td className="border-b px-3 py-4 font-black" style={{ borderColor: "var(--color-border)" }}>{report.totalRecords}</td>
            <td className="border-b px-3 py-4 font-black" style={{ borderColor: "var(--color-border)" }}>{report.format}</td>
            <td className="border-b px-3 py-4 font-bold" style={{ borderColor: "var(--color-border)" }}>{report.generatedAt}</td>
            <td className="border-b px-3 py-4" style={{ borderColor: "var(--color-border)" }}><ReportStatusBadge status={report.status} /></td>
            <td className="border-b px-3 py-4" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex items-center gap-2">
                    <button onClick={() => onPreview(report)} className="flex h-9 w-9 items-center justify-center rounded-[10px] border transition hk-admin-nav-hover" style={{ borderColor: "var(--color-border)" }} title="Preview report"><Eye size={15} /></button>
                    <button className="flex h-9 w-9 items-center justify-center rounded-[10px] border transition hk-admin-nav-hover" style={{ borderColor: "var(--color-border)" }} title="Download"><Download size={15} /></button>
                    <button className="flex h-9 w-9 items-center justify-center rounded-[10px] border transition hk-admin-nav-hover" style={{ borderColor: "var(--color-border)" }} title="Print"><Printer size={15} /></button>
                    <button className="flex h-9 w-9 items-center justify-center rounded-[10px] border transition hk-admin-nav-hover" style={{ borderColor: "var(--color-border)" }} title="More"><MoreHorizontal size={15} /></button>
                </div>
            </td>
        </tr>
    );
}
