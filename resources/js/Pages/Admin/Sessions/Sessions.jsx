import { Activity, Clock, LogIn, LogOut, ReceiptText } from "lucide-react";
import AdminShell from "../components/AdminShell";
import AdminModulePage from "../components/AdminModulePage";

const rows = [
    { id: 1, Session: "KS-20260519-001", User: "Hans Kurvey Filart", Method: "Barcode", Status: "Active", Started: "Today, 8:18 AM" },
    { id: 2, Session: "KS-20260519-002", User: "Maria Santos", Method: "Email", Status: "Completed", Started: "Today, 9:02 AM" },
    { id: 3, Session: "KS-20260518-014", User: "Faculty User", Method: "Barcode", Status: "Completed", Started: "Yesterday, 2:31 PM" },
];

export default function Sessions({ navigate }) {
    return (
        <AdminShell navigate={navigate} eyebrow="Kiosk Sessions" title="Session Tracking">
            <AdminModulePage
                icon={Activity}
                eyebrow="Session audit"
                title="Kiosk Sessions"
                description="Track every login session, kiosk flow, completed measurement set, logout, and timeout event."
                stats={[
                    { label: "Active", value: "1", caption: "Currently open", icon: Activity },
                    { label: "Today", value: "24", caption: "Started sessions", icon: LogIn },
                    { label: "Completed", value: "21", caption: "Clean exits", icon: LogOut },
                    { label: "Receipts", value: "17", caption: "Printed today", icon: ReceiptText },
                ]}
                columns={["Session", "User", "Method", "Status", "Started"]}
                rows={rows}
            />
        </AdminShell>
    );
}
