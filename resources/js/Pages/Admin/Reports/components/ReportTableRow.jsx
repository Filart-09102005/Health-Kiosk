import { useState } from "react";
import { FileSpreadsheet, FileText, Sparkles, Database } from "lucide-react";
import { authService, getErrorMessage } from "../../../Auth/services/authService";
import { useToast } from "../../../../Global/Toast";
import ExportActionButton from "../../../../Global/ExportActionButton";

export default function ReportTableRow({ report, filters, range }) {
    const { showToast } = useToast();
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);

    const recordsCount = report.records_count ?? 0;
    const hasData = recordsCount > 0;

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

    const handleDownload = async (actionType) => {
        if (!hasData) {
            showToast({
                type: "info",
                title: "No Data Available",
                message: `There are 0 records available for ${report.name} under the selected filters.`,
            });
            return false;
        }

        const isPdf = actionType === "pdf";
        isPdf ? setIsDownloadingPdf(true) : setIsDownloadingExcel(true);

        try {
            const params = buildQueryParams();
            
            // For Measurement Analytics, use our gorgeous client-side templates!
            if (report.id === 'measurement_analytics') {
                const { exportToPdf, exportToExcel } = await import('../../HealthRecords/utils/exportRecords.js');
                const response = await authService.downloadReportData(params);
                const records = response.data.data.map(item => ({
                    schoolId: item.user?.student_id || item.user?.barcode || "N/A",
                    fullName: item.user?.full_name || "Unknown",
                    role: item.user?.role || "Student",
                    department: item.user?.department || "N/A",
                    temperature: item.temperature,
                    heartRate: item.heart_rate,
                    spo2: item.spo2,
                    height: item.height,
                    weight: item.weight,
                    bmi: item.bmi,
                    healthStatus: item.health_status,
                    sessionStatus: item.kiosk_session_id ? 'Completed' : 'Unknown',
                    recordedAt: new Date(item.created_at).toLocaleString(),
                }));
                
                const options = { title: "HEALTH KIOSK SYSTEM", subtitle: report.name };

                // exportToPdf reports false when the popup was blocked, in which
                // case no file was produced and the button must not confirm one.
                if (isPdf && exportToPdf(records, options) === false) {
                    return false;
                }

                if (!isPdf) {
                    exportToExcel(records, options);
                }
                
                showToast({
                    type: "success",
                    title: "Export Complete",
                    message: `Your ${isPdf ? "PDF" : "Excel"} report (${recordsCount} records) has been generated successfully.`,
                });
                return true;
            }

            // Fallback for other report types
            const response = isPdf
                ? await authService.downloadReportPdf(params)
                : await authService.downloadReportExcel(params);

            let filename = `${report.id}_report.${isPdf ? "pdf" : "xlsx"}`;
            const disposition = response.headers["content-disposition"];
            if (disposition && disposition.indexOf("attachment") !== -1) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, "");
                }
            }

            const blob = new Blob([response.data], {
                type: isPdf ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            const url = window.URL.createObjectURL(blob);

            if (isPdf) {
                window.open(url, "_blank");
            } else {
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", filename);
                document.body.appendChild(link);
                link.click();
                link.remove();
            }

            setTimeout(() => window.URL.revokeObjectURL(url), 1000);

            showToast({
                type: "success",
                title: "Report Generated",
                message: `Your ${isPdf ? "PDF" : "Excel"} report (${recordsCount} records) is ready.`,
            });

            return true;
        } catch (error) {
            showToast({
                type: "error",
                title: "Download Failed",
                message: getErrorMessage(error, `An error occurred while generating the ${isPdf ? "PDF" : "Excel"} report.`),
            });

            return false;
        } finally {
            isPdf ? setIsDownloadingPdf(false) : setIsDownloadingExcel(false);
        }
    };

    return (
        <tr className="transition-colors hk-soft-hover border-b" style={{ borderColor: "var(--color-border)" }}>
            <td className="px-4 py-4 font-black">
                <div className="flex items-center gap-2.5">
                    <span
                        className="flex h-8 w-8 items-center justify-center rounded-xl shrink-0"
                        style={{
                            backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, var(--color-surface))",
                            color: "var(--color-primary)",
                        }}
                    >
                        <Sparkles size={15} />
                    </span>
                    <span className="font-black" style={{ color: "var(--color-text)" }}>{report.name}</span>

                    {/* Dynamic Row Count Badge */}
                    <span
                        className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.68rem] font-black shrink-0"
                        style={{
                            backgroundColor: hasData
                                ? "color-mix(in srgb, var(--color-success) 14%, var(--color-surface))"
                                : "var(--color-surface)",
                            borderColor: hasData
                                ? "color-mix(in srgb, var(--color-success) 30%, transparent)"
                                : "var(--color-border)",
                            color: hasData ? "var(--color-success)" : "var(--color-muted)",
                        }}
                    >
                        <Database size={11} />
                        {recordsCount} records
                    </span>
                </div>
            </td>

            <td className="px-4 py-4 text-xs font-semibold leading-5" style={{ color: "var(--color-muted)" }}>
                {report.description}
            </td>

            <td className="px-4 py-4">
                <div className="flex flex-row items-center gap-2">
                    <ExportActionButton
                        label="PDF"
                        icon={FileText}
                        onExport={() => handleDownload("pdf")}
                        disabled={isDownloadingPdf}
                        accent="var(--color-primary)"
                        title={hasData ? "Export report as PDF document" : "No records available for PDF export"}
                        style={{
                            borderColor: hasData
                                ? "color-mix(in srgb, var(--color-primary) 30%, transparent)"
                                : "var(--color-border)",
                            backgroundColor: hasData
                                ? "color-mix(in srgb, var(--color-primary) 10%, var(--color-surface))"
                                : "var(--color-surface)",
                            color: hasData ? "var(--color-primary)" : "var(--color-muted)",
                            opacity: hasData ? 1 : 0.6,
                        }}
                    />

                    <ExportActionButton
                        label="Excel"
                        icon={FileSpreadsheet}
                        iconColor={hasData ? "var(--color-success)" : "var(--color-muted)"}
                        onExport={() => handleDownload("excel")}
                        disabled={isDownloadingExcel}
                        accent="var(--color-success)"
                        title={hasData ? "Export report as Excel spreadsheet" : "No records available for Excel export"}
                        style={{
                            borderColor: "var(--color-border)",
                            backgroundColor: "var(--color-surface)",
                            color: hasData ? "var(--color-text)" : "var(--color-muted)",
                            opacity: hasData ? 1 : 0.6,
                        }}
                    />
                </div>
            </td>
        </tr>
    );
}
