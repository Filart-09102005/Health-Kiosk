import { useState } from "react";
import ReportsHeader from "./components/ReportsHeader";
import ReportsToolbar from "./components/ReportsToolbar";
import ReportsTable from "./components/ReportsTable";
import ReportPreviewDrawer from "./components/ReportPreviewDrawer";
import EmptyState from "./components/EmptyState";

const defaultRange = {
    dateFrom: "2026-05-01",
    timeFrom: "07:00",
    dateTo: "2026-05-19",
    timeTo: "17:00",
};

export default function Reports() {
    const [range, setRange] = useState(defaultRange);
    const [generatedReports, setGeneratedReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);

    const handleRangeChange = (key, value) => {
        setRange((current) => ({ ...current, [key]: value }));
    };

    const handleGenerateReport = () => {
        const dateRange = `${range.dateFrom} ${range.timeFrom} - ${range.dateTo} ${range.timeTo}`;

        setGeneratedReports([
            {
                id: `RPT-${Date.now().toString().slice(-6)}`,
                name: "Health Records Report",
                dateRange,
                generatedBy: "Clinic Admin",
                roleFilter: "All users",
                measurementType: "Health records",
                totalRecords: 128,
                format: "PDF",
                generatedAt: new Date().toLocaleString([], {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                    hour: "numeric",
                    minute: "2-digit",
                }),
                status: "Ready",
            },
        ]);
    };

    const handleRefresh = () => {
        setGeneratedReports([]);
        setSelectedReport(null);
    };

    return (
        <div className="mt-5 space-y-5">
            <ReportsHeader />
            <ReportsToolbar
                range={range}
                onRangeChange={handleRangeChange}
                onGenerate={handleGenerateReport}
                onRefresh={handleRefresh}
            />

            {generatedReports.length ? (
                <ReportsTable reports={generatedReports} onPreview={setSelectedReport} />
            ) : (
                <EmptyState
                    title="No generated report yet"
                    description="Select the date and time range above, then click Generate report to display report data."
                />
            )}

            <ReportPreviewDrawer report={selectedReport} open={Boolean(selectedReport)} onClose={() => setSelectedReport(null)} />
        </div>
    );
}
