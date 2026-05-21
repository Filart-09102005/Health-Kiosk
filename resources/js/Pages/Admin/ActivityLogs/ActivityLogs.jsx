import { Gauge, KeyRound, LogIn, LogOut } from "lucide-react";
import AdminShell from "../components/AdminShell";
import AdminModulePage from "../components/AdminModulePage";

const rows = [
    { id: 1, Actor: "Hans Kurvey Filart", Action: "login_success", Area: "Kiosk", Status: "Success", Time: "Today, 8:18 AM" },
    { id: 2, Actor: "Health Kiosk", Action: "printed_receipt", Area: "Records", Status: "Success", Time: "Today, 8:24 AM" },
    { id: 3, Actor: "Unknown", Action: "login_failed", Area: "Authentication", Status: "Failed", Time: "Today, 9:12 AM" },
];

export default function ActivityLogs({ navigate }) {
    return (
        <AdminShell navigate={navigate} eyebrow="Activity Logs" title="Audit Trail">
            <AdminModulePage
                icon={Gauge}
                eyebrow="System activity"
                title="Activity Logs"
                description="Review login attempts, session actions, admin changes, receipt printing, and security events."
                stats={[
                    { label: "Events Today", value: "118", caption: "Tracked actions", icon: Gauge },
                    { label: "Logins", value: "34", caption: "Successful access", icon: LogIn },
                    { label: "Failed", value: "3", caption: "Blocked attempts", icon: KeyRound },
                    { label: "Logouts", value: "29", caption: "Ended sessions", icon: LogOut },
                ]}
                columns={["Actor", "Action", "Area", "Status", "Time"]}
                rows={rows}
            />
        </AdminShell>
    );
}
