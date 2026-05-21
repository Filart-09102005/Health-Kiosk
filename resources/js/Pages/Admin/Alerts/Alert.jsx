import { useMemo, useState } from "react";
import { Activity, BellRing, Clock3, ShieldAlert, Siren, Thermometer, TrendingUp, UserRoundCheck } from "lucide-react";
import AlertsHeader from "./components/AlertsHeader";
import AlertsOverviewGrid from "./components/AlertsOverviewGrid";
import AlertsToolbar from "./components/AlertsToolbar";
import AlertsTable from "./components/AlertsTable";
import AlertDetailsDrawer from "./components/AlertDetailsDrawer";
import AlertAnalyticsPanel from "./components/AlertAnalyticsPanel";
import RecentCriticalAlerts from "./components/RecentCriticalAlerts";
import RealtimeAlertFeed from "./components/RealtimeAlertFeed";
import AlertInsightsPanel from "./components/AlertInsightsPanel";
import NotificationPreviewCard from "./components/NotificationPreviewCard";
import EmptyState from "./components/EmptyState";

const alerts = [
    {
        id: "ALT-2026-001",
        schoolId: "C-230204",
        fullName: "Hans Kurvey Filart",
        role: "student",
        alertType: "High Temperature",
        measurementValue: "38.4 C",
        severity: "Critical",
        status: "Pending",
        sessionStatus: "Active",
        triggeredAt: "Today, 8:20 AM",
        reviewedBy: "Unassigned",
        department: "COLLEGE",
        heartRate: "98 bpm",
        spo2: "97%",
        bmi: "21.3",
        advice: "Escort user to clinic area and recheck temperature after rest.",
    },
    {
        id: "ALT-2026-002",
        schoolId: "F-1001",
        fullName: "Faculty User",
        role: "teacher",
        alertType: "Low SpO2",
        measurementValue: "93%",
        severity: "High",
        status: "Reviewed",
        sessionStatus: "Completed",
        triggeredAt: "Today, 9:05 AM",
        reviewedBy: "Clinic Admin",
        department: "FACULTY",
        heartRate: "92 bpm",
        spo2: "93%",
        bmi: "24.2",
        advice: "Recommend seated rest and repeat oxygen reading.",
    },
    {
        id: "ALT-2026-003",
        schoolId: "C-230188",
        fullName: "Maria Santos",
        role: "student",
        alertType: "Abnormal Heart Rate",
        measurementValue: "122 bpm",
        severity: "Medium",
        status: "Escalated",
        sessionStatus: "Completed",
        triggeredAt: "Yesterday, 2:41 PM",
        reviewedBy: "Nurse Lea",
        department: "BED",
        heartRate: "122 bpm",
        spo2: "96%",
        bmi: "20.8",
        advice: "Notify clinic staff and verify recent activity before measurement.",
    },
    {
        id: "ALT-2026-004",
        schoolId: "C-230199",
        fullName: "John Rivera",
        role: "student",
        alertType: "BMI Warning",
        measurementValue: "29.4 BMI",
        severity: "Low",
        status: "Resolved",
        sessionStatus: "Completed",
        triggeredAt: "Yesterday, 11:13 AM",
        reviewedBy: "Clinic Admin",
        department: "COLLEGE",
        heartRate: "78 bpm",
        spo2: "98%",
        bmi: "29.4",
        advice: "Provide lifestyle reminder and encourage regular monitoring.",
    },
];

const overview = [
    { label: "Total Alerts Today", value: "24", trend: "+12%", severity: "Medium", icon: BellRing },
    { label: "Critical Alerts", value: "3", trend: "+2", severity: "Critical", icon: Siren },
    { label: "Warning Alerts", value: "11", trend: "-4%", severity: "High", icon: ShieldAlert },
    { label: "Resolved Alerts", value: "18", trend: "+8%", severity: "Low", icon: UserRoundCheck },
    { label: "Pending Alerts", value: "6", trend: "+1", severity: "Medium", icon: Clock3 },
    { label: "Average Response Time", value: "6m", trend: "-2m", severity: "Low", icon: Activity },
    { label: "Active Health Warnings", value: "9", trend: "+3", severity: "High", icon: Thermometer },
    { label: "Escalated Cases", value: "4", trend: "+1", severity: "Critical", icon: TrendingUp },
];

export default function Alert() {
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [search, setSearch] = useState("");

    const filteredAlerts = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (! term) return alerts;

        return alerts.filter((alert) => [
            alert.id,
            alert.schoolId,
            alert.fullName,
            alert.role,
            alert.alertType,
            alert.severity,
            alert.status,
        ].some((value) => String(value).toLowerCase().includes(term)));
    }, [search]);

    const criticalAlerts = alerts.filter((alert) => ["Critical", "High"].includes(alert.severity));

    return (
        <div className="mt-5 space-y-5">
            <AlertsHeader />
            <AlertsOverviewGrid metrics={overview} />
            <AlertsToolbar search={search} onSearch={setSearch} />

            <div className="grid gap-5 xl:grid-cols-[1.6fr_0.8fr]">
                {filteredAlerts.length ? (
                    <AlertsTable alerts={filteredAlerts} onView={setSelectedAlert} />
                ) : (
                    <EmptyState title="No matching alerts" description="Try adjusting severity, status, date range, or search terms." />
                )}
                <div className="space-y-5">
                    <RealtimeAlertFeed alerts={alerts} />
                    <RecentCriticalAlerts alerts={criticalAlerts} onView={setSelectedAlert} />
                </div>
            </div>

            <AlertAnalyticsPanel />
            <AlertInsightsPanel />

            <section className="grid gap-5 lg:grid-cols-3">
                <NotificationPreviewCard type="Alert notification" title="Critical temperature detected" message="ALT-2026-001 requires clinic review." />
                <NotificationPreviewCard type="Email preview" title="Health alert summary" message="A critical kiosk alert has been queued for clinic staff." />
                <NotificationPreviewCard type="System warning" title="Escalation reminder" message="Unresolved high severity alert approaching response limit." />
            </section>

            <AlertDetailsDrawer alert={selectedAlert} open={Boolean(selectedAlert)} onClose={() => setSelectedAlert(null)} />
        </div>
    );
}
