import { useEffect, useMemo, useState } from "react";
import { BellRing, Clock3, Gauge, ShieldAlert, Siren, Thermometer, TrendingUp, UserRoundCheck } from "lucide-react";
import AlertsHeader from "./components/AlertsHeader";
import AlertsOverviewGrid from "./components/AlertsOverviewGrid";
import AlertsToolbar from "./components/AlertsToolbar";
import AlertsTable from "./components/AlertsTable";
import AlertDetailsDrawer from "./components/AlertDetailsDrawer";
import RecentCriticalAlerts from "./components/RecentCriticalAlerts";
import RealtimeAlertFeed from "./components/RealtimeAlertFeed";
import EmptyState from "./components/EmptyState";
import {
    ALERT_SETTINGS_CHANGE_EVENT,
    applySensitivityToAlerts,
    getAlertSensitivityProfile,
    getStoredAlertSensitivity,
    isAlertsEnabled,
} from "./utils/alertSensitivity";

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
    {
        id: "ALT-2026-005",
        schoolId: "C-230245",
        fullName: "Ana Reyes",
        role: "student",
        alertType: "Needs Attention Temperature",
        measurementValue: "37.3 C",
        severity: "Medium",
        status: "Pending",
        sessionStatus: "Completed",
        triggeredAt: "Today, 9:18 AM",
        reviewedBy: "Unassigned",
        department: "COLLEGE",
        heartRate: "84 bpm",
        spo2: "98%",
        bmi: "19.8",
        advice: "Repeat temperature reading after a short rest period.",
    },
];

export default function Alert() {
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [search, setSearch] = useState("");
    const [sensitivity, setSensitivity] = useState(getStoredAlertSensitivity);
    const [alertsEnabled, setAlertsEnabled] = useState(isAlertsEnabled);

    useEffect(() => {
        const refreshAlertSettings = () => {
            setSensitivity(getStoredAlertSensitivity());
            setAlertsEnabled(isAlertsEnabled());
        };

        window.addEventListener("storage", refreshAlertSettings);
        window.addEventListener(ALERT_SETTINGS_CHANGE_EVENT, refreshAlertSettings);

        return () => {
            window.removeEventListener("storage", refreshAlertSettings);
            window.removeEventListener(ALERT_SETTINGS_CHANGE_EVENT, refreshAlertSettings);
        };
    }, []);

    const sensitivityProfile = useMemo(() => getAlertSensitivityProfile(sensitivity), [sensitivity]);
    const queuedAlerts = useMemo(() => {
        if (! alertsEnabled) return [];

        return applySensitivityToAlerts(alerts, sensitivity);
    }, [alertsEnabled, sensitivity]);

    const overview = useMemo(() => {
        const criticalCount = queuedAlerts.filter((alert) => alert.severity === "Critical").length;
        const highCount = queuedAlerts.filter((alert) => alert.severity === "High").length;
        const resolvedCount = queuedAlerts.filter((alert) => alert.status === "Resolved").length;
        const pendingCount = queuedAlerts.filter((alert) => alert.status === "Pending").length;
        const activeCount = queuedAlerts.filter((alert) => alert.status !== "Resolved").length;
        const escalatedCount = queuedAlerts.filter((alert) => alert.status === "Escalated").length;

        return [
            { label: "Queued Alerts", value: String(queuedAlerts.length), trend: alertsEnabled ? `${sensitivityProfile.queueRate}%` : "Off", severity: "Medium", icon: BellRing },
            { label: "Critical Alerts", value: String(criticalCount), trend: alertsEnabled ? "Immediate" : "Off", severity: "Critical", icon: Siren },
            { label: "High Alerts", value: String(highCount), trend: sensitivityProfile.delayLabel, severity: "High", icon: ShieldAlert },
            { label: "Resolved Alerts", value: String(resolvedCount), trend: "Reviewed", severity: "Low", icon: UserRoundCheck },
            { label: "Pending Alerts", value: String(pendingCount), trend: alertsEnabled ? "+live" : "Paused", severity: "Medium", icon: Clock3 },
            { label: "Detection Rate", value: alertsEnabled ? `${sensitivityProfile.queueRate}%` : "0%", trend: sensitivityProfile.label, severity: alertsEnabled ? "Low" : "High", icon: Gauge },
            { label: "Active Health Warnings", value: String(activeCount), trend: sensitivityProfile.delayLabel, severity: "High", icon: Thermometer },
            { label: "Escalated Cases", value: String(escalatedCount), trend: alertsEnabled ? "Clinic" : "Paused", severity: "Critical", icon: TrendingUp },
        ];
    }, [alertsEnabled, queuedAlerts, sensitivityProfile]);

    const filteredAlerts = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (! term) return queuedAlerts;

        return queuedAlerts.filter((alert) => [
            alert.id,
            alert.schoolId,
            alert.fullName,
            alert.role,
            alert.alertType,
            alert.severity,
            alert.status,
        ].some((value) => String(value).toLowerCase().includes(term)));
    }, [queuedAlerts, search]);

    const criticalAlerts = queuedAlerts.filter((alert) => ["Critical", "High"].includes(alert.severity));

    return (
        <div className="mt-5 space-y-5">
            <AlertsHeader alertsEnabled={alertsEnabled} sensitivityProfile={sensitivityProfile} />
            <AlertsOverviewGrid metrics={overview} />
            <AlertsToolbar search={search} onSearch={setSearch} />

            <div className="grid gap-5 md:grid-cols-2">
                <RealtimeAlertFeed alerts={queuedAlerts} alertsEnabled={alertsEnabled} sensitivityProfile={sensitivityProfile} />
                <RecentCriticalAlerts alerts={criticalAlerts} onView={setSelectedAlert} />
            </div>

            {filteredAlerts.length ? (
                <AlertsTable alerts={filteredAlerts} onView={setSelectedAlert} />
            ) : (
                <EmptyState title="No matching alerts" description="Try adjusting severity, status, date range, or search terms." />
            )}

            <AlertDetailsDrawer alert={selectedAlert} open={Boolean(selectedAlert)} onClose={() => setSelectedAlert(null)} />
        </div>
    );
}
