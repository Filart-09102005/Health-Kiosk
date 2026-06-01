import { Gauge, KeyRound, LogIn, ShieldAlert } from "lucide-react";
import AdminShell from "../components/AdminShell";
import AdminModulePage from "../components/AdminModulePage";

const rows = [
    { id: 1, Actor: "Clinic Admin", Action: "Viewed health record", Area: "Health Records", Status: "Success", Time: "May 21, 2026 09:42 AM", Details: "Opened Juan Dela Cruz record SES-4" },
    { id: 2, Actor: "Clinic Admin", Action: "Generated report", Area: "Reports", Status: "Success", Time: "May 21, 2026 09:38 AM", Details: "Created health records report for May 1-21" },
    { id: 3, Actor: "Clinic Admin", Action: "Exported PDF", Area: "Reports", Status: "Success", Time: "May 21, 2026 09:36 AM", Details: "Downloaded report as PDF" },
    { id: 4, Actor: "Health Kiosk", Action: "Printed receipt", Area: "Health Records", Status: "Success", Time: "May 21, 2026 09:21 AM", Details: "Printed health check summary for Faculty User" },
    { id: 5, Actor: "Weight Sensor", Action: "Device offline", Area: "Devices / Sensors", Status: "Alert", Time: "May 21, 2026 09:10 AM", Details: "No signal from load-cell platform" },
    { id: 6, Actor: "Unknown user", Action: "Failed admin login", Area: "Authentication", Status: "Failed", Time: "May 21, 2026 08:57 AM", Details: "Invalid password attempt for admin account" },
    { id: 7, Actor: "Clinic Admin", Action: "Viewed kiosk session", Area: "Kiosk Sessions", Status: "Success", Time: "May 21, 2026 08:44 AM", Details: "Opened session timeline for Hans Kurvey Filart" },
    { id: 8, Actor: "Mini PC / Server", Action: "Database heartbeat", Area: "System", Status: "Success", Time: "May 21, 2026 08:30 AM", Details: "Laravel app and database responded normally" },
    { id: 9, Actor: "User Presence Detection", Action: "Presence service ready", Area: "Devices / Sensors", Status: "Success", Time: "May 21, 2026 08:25 AM", Details: "Camera-based user detection service returned READY" },
    { id: 10, Actor: "Clinic Admin", Action: "Updated teacher record", Area: "User Management", Status: "Success", Time: "May 21, 2026 08:18 AM", Details: "Edited teacher profile data" },
    { id: 11, Actor: "Clinic Admin", Action: "Deleted student row", Area: "User Management", Status: "Success", Time: "May 21, 2026 08:12 AM", Details: "Removed duplicate student demo record" },
    { id: 12, Actor: "SMTP Service", Action: "Password reset email", Area: "Authentication", Status: "Success", Time: "May 21, 2026 08:05 AM", Details: "Sent reset link to registered user email" },
    { id: 13, Actor: "Temperature Sensor", Action: "High temperature alert", Area: "Health Alerts", Status: "Alert", Time: "May 21, 2026 07:58 AM", Details: "Alert created after elevated temperature reading" },
    { id: 14, Actor: "Clinic Admin", Action: "Exported Excel", Area: "Reports", Status: "Success", Time: "May 21, 2026 07:45 AM", Details: "Downloaded generated report as Excel" },
    { id: 15, Actor: "Barcode Scanner", Action: "No telemetry detected", Area: "Devices / Sensors", Status: "Pending", Time: "May 21, 2026 07:30 AM", Details: "Barcode scanner scan-event telemetry is not configured" },
];

const successCount = rows.filter((row) => row.Status === "Success").length;
const failedCount = rows.filter((row) => row.Status === "Failed").length;
const alertCount = rows.filter((row) => row.Status === "Alert").length;

export default function ActivityLogs({ navigate }) {
    return (
        <AdminShell navigate={navigate} eyebrow="Activity Logs" title="Audit Trail">
            <AdminModulePage
                icon={Gauge}
                eyebrow="System activity"
                title="Activity Logs"
                description="Review login attempts, session actions, admin changes, receipt printing, and security events."
                stats={[
                    { label: "Events Today", value: String(rows.length), caption: "Tracked admin and system actions", icon: Gauge },
                    { label: "Successful Events", value: String(successCount), caption: "Completed without issue", icon: LogIn },
                    { label: "Failed Attempts", value: String(failedCount), caption: "Blocked or invalid actions", icon: KeyRound },
                    { label: "System Alerts", value: String(alertCount), caption: "Needs admin review", icon: ShieldAlert },
                ]}
                columns={["Actor", "Action", "Area", "Status", "Time", "Details"]}
                rows={rows}
                tablePageSize={10}
            />
        </AdminShell>
    );
}
