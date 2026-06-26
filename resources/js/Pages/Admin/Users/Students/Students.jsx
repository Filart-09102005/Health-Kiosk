import { useEffect, useMemo, useState } from "react";
import { GraduationCap, School, UsersRound } from "lucide-react";
import { authService, getErrorMessage } from "../../../Auth/services/authService";
import { useToast } from "../../../Global/Toast";
import AdminShell from "../../components/AdminShell";
import AdminModulePage from "../../components/AdminModulePage";
import StudentsTable from "./components/StudentsTable";

export default function Students({ navigate }) {
    const { showToast } = useToast();
    const [rows, setRows] = useState([]);

    useEffect(() => {
        let alive = true;

        authService.adminUsers({ role: "student", per_page: 50 })
            .then((response) => {
                if (alive) setRows(response.data?.data || []);
            })
            .catch((error) => {
                if (!alive) return;

                showToast({
                    type: "error",
                    title: "Students unavailable",
                    message: getErrorMessage(error, "Unable to load student accounts right now."),
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
        const bed = rows.filter((row) => row.department === "BED").length;
        const college = rows.filter((row) => row.department === "COLLEGE").length;

        return [
            { label: "Students", value: String(rows.length), caption: "Registered accounts", icon: UsersRound },
            { label: "BED", value: String(bed), caption: "Department split", icon: School },
            { label: "College", value: String(college), caption: "Department split", icon: GraduationCap },
        ];
    }, [rows]);

    return (
        <AdminShell navigate={navigate} eyebrow="User Management" title="Students">
            <AdminModulePage
                icon={UsersRound}
                eyebrow="Student accounts"
                title="Students"
                description="Manage student kiosk access, school email verification, barcode identity, and department grouping."
                stats={stats}
                showHeaderActions={false}
            >
                <StudentsTable rows={rows} />
            </AdminModulePage>
        </AdminShell>
    );
}
