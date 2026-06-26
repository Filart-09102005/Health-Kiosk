import SectionHeader from "./SectionHeader";
import RecentActivityLogsTable from "./RecentActivityLogsTable";
import RecentAlertsTable from "./RecentAlertsTable";
import RecentHealthRecordsTable from "./RecentHealthRecordsTable";
import RecentSessionsTable from "./RecentSessionsTable";

export default function DashboardTables({ data }) {
    return (
        <section className="space-y-4">
            <SectionHeader
                title="Operational tables"
                description="Recent clinic records, alerts, sessions, and audit activity."
            />
            <RecentHealthRecordsTable records={data?.recent_health_records || []} />
            <RecentAlertsTable records={data?.recent_alerts || []} />
            <RecentSessionsTable records={data?.recent_sessions || []} />
            <RecentActivityLogsTable records={data?.recent_activity_logs || []} />
        </section>
    );
}
