import SectionHeader from "./SectionHeader";
import RecentActivityLogsTable from "./RecentActivityLogsTable";
import RecentAlertsTable from "./RecentAlertsTable";
import RecentHealthRecordsTable from "./RecentHealthRecordsTable";
import RecentSessionsTable from "./RecentSessionsTable";

export default function DashboardTables() {
    return (
        <section className="space-y-4">
            <SectionHeader
                title="Operational tables"
                description="Recent clinic records, alerts, sessions, and audit activity."
            />
            <RecentHealthRecordsTable />
            <RecentAlertsTable />
            <RecentSessionsTable />
            <RecentActivityLogsTable />
        </section>
    );
}
