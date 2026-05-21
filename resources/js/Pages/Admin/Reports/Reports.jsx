import { useMemo, useState } from "react";
import { Activity, CalendarDays, ClipboardCheck, Download, FileSpreadsheet, FileText, Printer, TrendingUp } from "lucide-react";
import ReportsHeader from "./components/ReportsHeader";
import ReportsOverviewGrid from "./components/ReportsOverviewGrid";
import ReportsToolbar from "./components/ReportsToolbar";
import ReportsTable from "./components/ReportsTable";
import ReportPreviewDrawer from "./components/ReportPreviewDrawer";
import ReportStatisticsPanel from "./components/ReportStatisticsPanel";
import ExportOptionsCard from "./components/ExportOptionsCard";
import QuickExportPanel from "./components/QuickExportPanel";
import ReportTemplatesPanel from "./components/ReportTemplatesPanel";
import ReportMetricsGrid from "./components/ReportMetricsGrid";
import TopHealthIssuesPanel from "./components/TopHealthIssuesPanel";
import TopMeasurementsPanel from "./components/TopMeasurementsPanel";
import MostActiveUsersPanel from "./components/MostActiveUsersPanel";
import CompletionRatePanel from "./components/CompletionRatePanel";
import RecentExportsTable from "./components/RecentExportsTable";
import ScheduledReportsCard from "./components/ScheduledReportsCard";
import SavedReportsPanel from "./components/SavedReportsPanel";
import EmptyState from "./components/EmptyState";

const reports = [
    { id: "RPT-2026-001", name: "Daily Health Monitoring Report", dateRange: "Today", generatedBy: "Clinic Admin", roleFilter: "All Roles", measurementType: "All Measurements", totalRecords: 128, format: "PDF", generatedAt: "Today, 9:15 AM", status: "Ready" },
    { id: "RPT-2026-002", name: "Weekly Alert Monitoring Report", dateRange: "May 13 - May 19", generatedBy: "Health Kiosk", roleFilter: "Students", measurementType: "Alerts", totalRecords: 42, format: "Excel", generatedAt: "Today, 8:40 AM", status: "Generated" },
    { id: "RPT-2026-003", name: "BMI Summary Report", dateRange: "This Month", generatedBy: "Clinic Admin", roleFilter: "Students", measurementType: "BMI", totalRecords: 312, format: "PDF", generatedAt: "Yesterday, 3:22 PM", status: "Scheduled" },
    { id: "RPT-2026-004", name: "Teacher Wellness Snapshot", dateRange: "May 2026", generatedBy: "Nurse Lea", roleFilter: "Teachers", measurementType: "Vitals", totalRecords: 86, format: "Print", generatedAt: "Yesterday, 10:10 AM", status: "Exported" },
];

const overview = [
    { label: "Total Reports Generated", value: "148", trend: "+18%", icon: FileText },
    { label: "Reports Exported Today", value: "16", trend: "+6", icon: Download },
    { label: "Total Health Records", value: "2,814", trend: "+124", icon: ClipboardCheck },
    { label: "Average Daily Measurements", value: "214", trend: "+9%", icon: Activity },
    { label: "Alert Reports", value: "32", trend: "+4", icon: TrendingUp },
    { label: "Completed Sessions", value: "1,908", trend: "+11%", icon: CalendarDays },
    { label: "Most Active Day", value: "Tue", trend: "426 checks", icon: Printer },
    { label: "Export Success Rate", value: "99.2%", trend: "+1.1%", icon: FileSpreadsheet },
];

export default function Reports() {
    const [search, setSearch] = useState("");
    const [selectedReport, setSelectedReport] = useState(null);

    const filteredReports = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return reports;

        return reports.filter((report) => [
            report.id,
            report.name,
            report.dateRange,
            report.generatedBy,
            report.roleFilter,
            report.measurementType,
            report.format,
            report.status,
        ].some((value) => String(value).toLowerCase().includes(term)));
    }, [search]);

    return (
        <div className="mt-5 space-y-5">
            <ReportsHeader />
            <ReportsOverviewGrid metrics={overview} />
            <ReportsToolbar search={search} onSearch={setSearch} />

            <div className="grid gap-5 xl:grid-cols-[1.55fr_0.85fr]">
                {filteredReports.length ? (
                    <ReportsTable reports={filteredReports} onPreview={setSelectedReport} />
                ) : (
                    <EmptyState title="No matching reports" description="Try changing the report name, role, status, date range, or export format." />
                )}

                <div className="space-y-5">
                    <ExportOptionsCard />
                    <ScheduledReportsCard />
                </div>
            </div>

            <ReportStatisticsPanel />

            <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
                <QuickExportPanel />
                <ReportTemplatesPanel />
            </div>

            <ReportMetricsGrid />

            <div className="grid gap-5 xl:grid-cols-4">
                <TopHealthIssuesPanel />
                <TopMeasurementsPanel />
                <MostActiveUsersPanel />
                <CompletionRatePanel />
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                <RecentExportsTable />
                <SavedReportsPanel reports={reports} onPreview={setSelectedReport} />
            </div>

            <ReportPreviewDrawer report={selectedReport} open={Boolean(selectedReport)} onClose={() => setSelectedReport(null)} />
        </div>
    );
}
