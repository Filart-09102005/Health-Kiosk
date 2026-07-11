import { useState } from "react";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { authService, getErrorMessage } from "../../../Auth/services/authService";
import { useToast } from "../../../../Global/Toast";

export default function ReportTableRow({ report, filters, range }) {
    const { showToast } = useToast();
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);

    // Build the query object from filters and range for Axios
    const buildQueryParams = () => {
        const params = { type: report.id };
        
        if (range?.dateFrom) params.date_from = range.dateFrom;
        if (range?.dateTo) params.date_to = range.dateTo;
        if (filters?.department) params.department = filters.department;
        if (filters?.gender) params.gender = filters.gender;
        
        if (filters?.program?.length) params.program = filters.program.join(",");
        if (filters?.strand?.length) params.strand = filters.strand.join(",");
        if (filters?.year_level?.length) params.year_level = filters.year_level.join(",");
        if (filters?.grade_level?.length) params.grade_level = filters.grade_level.join(",");
        
        return params;
    };

    const handleDownload = async (type) => {
        const isPdf = type === 'pdf';
        isPdf ? setIsDownloadingPdf(true) : setIsDownloadingExcel(true);

        try {
            const params = buildQueryParams();
            const response = isPdf 
                ? await authService.downloadReportPdf(params)
                : await authService.downloadReportExcel(params);
            
            // Extract filename from Content-Disposition header if available
            let filename = `${report.id}_report.${isPdf ? 'pdf' : 'xlsx'}`;
            const disposition = response.headers['content-disposition'];
            if (disposition && disposition.indexOf('attachment') !== -1) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) { 
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            const blob = new Blob([response.data], { 
                type: isPdf ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
            const url = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            // Clean up the object URL
            setTimeout(() => window.URL.revokeObjectURL(url), 100);

            showToast({
                type: "success",
                title: "Download Complete",
                message: `Your ${isPdf ? 'PDF' : 'Excel'} report has been downloaded successfully.`,
            });
        } catch (error) {
            showToast({
                type: "error",
                title: "Download Failed",
                message: getErrorMessage(error, `An error occurred while generating the ${isPdf ? 'PDF' : 'Excel'} report.`),
            });
        } finally {
            isPdf ? setIsDownloadingPdf(false) : setIsDownloadingExcel(false);
        }
    };

    return (
        <tr className="transition hover:bg-[color-mix(in_srgb,var(--color-text)_4%,transparent)]">
            <td className="border-b px-3 py-3 font-black" style={{ borderColor: "var(--color-border)" }}>
                {report.name}
            </td>
            <td className="border-b px-3 py-3" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>
                {report.description}
            </td>
            <td className="border-b px-3 py-3" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex flex-row items-stretch gap-2">
                    <button
                        onClick={() => handleDownload('pdf')}
                        disabled={isDownloadingPdf}
                        className="inline-flex h-8 w-20 items-center justify-center gap-1.5 rounded-[9px] border px-3 text-[0.68rem] font-black transition hk-admin-nav-hover disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
                        title="Export report as PDF document"
                    >
                        {isDownloadingPdf ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <>
                                <FileText size={14} />
                                PDF
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => handleDownload('excel')}
                        disabled={isDownloadingExcel}
                        className="inline-flex h-8 w-20 items-center justify-center gap-1.5 rounded-[9px] border px-3 text-[0.68rem] font-black transition hk-admin-nav-hover disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
                        title="Export report as Excel spreadsheet"
                    >
                        {isDownloadingExcel ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <>
                                <FileSpreadsheet size={14} />
                                Excel
                            </>
                        )}
                    </button>
                </div>
            </td>
        </tr>
    );
}
