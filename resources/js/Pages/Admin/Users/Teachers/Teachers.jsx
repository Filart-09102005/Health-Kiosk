import { useEffect, useMemo, useState, useCallback } from "react";
import { CheckCircle2, CircleDashed, Stethoscope, UserPlus, GraduationCap, BookOpen, Briefcase, UploadCloud } from "lucide-react";
import { authService, getErrorMessage } from "../../../Auth/services/authService";
import { useToast } from "../../../Global/Toast";
import AdminShell from "../../components/AdminShell";
import AdminModulePage from "../../components/AdminModulePage";
import UserAccountsTable from "../components/UserAccountsTable";
import AddUserModal from "../components/AddUserModal";
import ImportUsersModal from "../components/ImportUsersModal";

export default function Teachers({ navigate }) {
    const { showToast } = useToast();
    const [rows, setRows] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const loadTeachers = useCallback(() => {
        authService.adminUsers({ role: "teacher", per_page: 200 })
            .then((response) => {
                setRows(response.data?.data || []);
            })
            .catch((error) => {
                showToast({
                    type: "error",
                    title: "Teachers unavailable",
                    message: getErrorMessage(error, "Unable to load teacher accounts right now."),
                });

                if (error?.response?.status === 401 || error?.response?.status === 403) {
                    navigate("/login");
                }
            });
    }, [navigate, showToast]);

    useEffect(() => {
        loadTeachers();
    }, [loadTeachers]);

    const stats = useMemo(() => {
        const college = rows.filter((row) => {
            const d = String(row.department || "").toUpperCase();
            return d.includes("COLLEGE");
        }).length;

        const bed = rows.filter((row) => {
            const d = String(row.department || "").toUpperCase();
            return d.includes("BED") || d.includes("HIGH SCHOOL") || d.includes("ELEMENTARY") || d.includes("BASIC EDUCATION");
        }).length;

        const ntp = rows.filter((row) => {
            const d = String(row.department || "").toUpperCase();
            return d === "NTP" || d.includes("NON-TEACHING");
        }).length;

        return [
            { label: "Total Teachers", value: String(rows.length), caption: "Registered accounts", icon: Stethoscope },
            { label: "College", value: String(college), caption: "College Instructors", icon: GraduationCap },
            { label: "BED", value: String(bed), caption: "Basic Education Instructors", icon: BookOpen },
            { label: "NTP", value: String(ntp), caption: "Non-Teaching Personnel", icon: Briefcase },
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
                <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                    <div className="min-w-0">
                        <h3 className="text-xl font-black tracking-tight" style={{ color: "var(--color-text)" }}>
                            Teacher &amp; Staff Records
                        </h3>
                        <p className="mt-1 text-sm font-semibold" style={{ color: "var(--color-muted)" }}>
                            {rows.length} registered {rows.length === 1 ? "account" : "accounts"} across teaching and non-teaching roles.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setIsImportModalOpen(true)}
                            className="flex shrink-0 items-center gap-2 rounded-2xl border px-5 py-3 text-xs font-black shadow-sm transition-all hk-admin-nav-hover active:translate-y-0"
                            style={{
                                backgroundColor: "var(--color-card)",
                                color: "var(--color-text)",
                                borderColor: "var(--color-border)",
                            }}
                        >
                            <UploadCloud size={16} />
                            <span>Import Personnel</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex shrink-0 items-center gap-2 rounded-2xl px-5 py-3 text-xs font-black shadow-lg transition-all hk-primary-hover hover:-translate-y-0.5 active:translate-y-0"
                            style={{
                                backgroundColor: "var(--color-primary)",
                                color: "var(--color-primary-content)",
                                boxShadow: "0 10px 24px -10px color-mix(in srgb, var(--color-primary) 90%, transparent)",
                            }}
                        >
                            <UserPlus size={16} />
                            <span>Add New Personnel</span>
                        </button>
                    </div>
                </div>

                <UserAccountsTable rows={rows} idLabel="Teacher ID" noun="teacher" />

                <AddUserModal
                    open={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    defaultRole="personnel"
                    onSuccess={loadTeachers}
                />

                <ImportUsersModal
                    open={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    role="personnel"
                    onSuccess={loadTeachers}
                />
            </AdminModulePage>
        </AdminShell>
    );
}
