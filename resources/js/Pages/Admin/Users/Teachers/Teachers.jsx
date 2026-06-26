import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleDashed, Stethoscope } from "lucide-react";
import { authService, getErrorMessage } from "../../../Auth/services/authService";
import { useToast } from "../../../Global/Toast";
import AdminShell from "../../components/AdminShell";
import AdminModulePage from "../../components/AdminModulePage";
import TeachersTable from "./components/TeachersTable";

export default function Teachers({ navigate }) {
    const { showToast } = useToast();
    const [rows, setRows] = useState([]);

    useEffect(() => {
        let alive = true;

        authService.adminUsers({ role: "teacher", per_page: 50 })
            .then((response) => {
                if (alive) setRows(response.data?.data || []);
            })
            .catch((error) => {
                if (!alive) return;

                showToast({
                    type: "error",
                    title: "Teachers unavailable",
                    message: getErrorMessage(error, "Unable to load teacher accounts right now."),
                });

                if (error?.response?.status === 401 || error?.response?.status === 403) {
                    navigate("/login");
                }
            });

        return () => {
            alive = false;
        };
    }, [navigate, showToast]);

    const stats = useMemo(() => {
        const verified = rows.filter((row) => row.email_verified_at).length;

        return [
            { label: "Teachers", value: String(rows.length), caption: "Registered accounts", icon: Stethoscope },
            { label: "Verified", value: String(verified), caption: "Email verified", icon: CheckCircle2 },
            { label: "Pending", value: String(rows.length - verified), caption: "Awaiting verification", icon: CircleDashed },
        ];
    }, [rows]);

    return (
        <AdminShell navigate={navigate} eyebrow="User Management" title="Teachers">
            <AdminModulePage
                icon={Stethoscope}
                eyebrow="Teacher accounts"
                title="Teachers"
                description="Manage teacher kiosk access, verification, department assignment, and barcode identity."
                stats={stats}
                showHeaderActions={false}
            >
                <TeachersTable rows={rows} />
            </AdminModulePage>
        </AdminShell>
    );
}
