import { useEffect, useMemo, useState, useCallback } from "react";
import { GraduationCap, School, UsersRound, UserPlus, UploadCloud } from "lucide-react";
import { authService, getErrorMessage } from "../../../Auth/services/authService";
import { useToast } from "../../../Global/Toast";
import AdminShell from "../../components/AdminShell";
import AdminModulePage from "../../components/AdminModulePage";
import UserAccountsTable from "../components/UserAccountsTable";
import AddUserModal from "../components/AddUserModal";
import ImportUsersModal from "../components/ImportUsersModal";

export default function Students({ navigate }) {
    const { showToast } = useToast();
    const [rows, setRows] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const loadStudents = useCallback(() => {
        authService.adminUsers({ role: "student", per_page: 200 })
            .then((response) => {
                setRows(response.data?.data || []);
            })
            .catch((error) => {
                showToast({
                    type: "error",
                    title: "Students unavailable",
                    message: getErrorMessage(error, "Unable to load student accounts right now."),
                });

                if (error?.response?.status === 401 || error?.response?.status === 403) {
                    navigate("/login");
                }
            });
    }, [navigate, showToast]);

    useEffect(() => {
        loadStudents();
    }, [loadStudents]);

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
                <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                    <div className="min-w-0">
                        <h3 className="text-xl font-black tracking-tight" style={{ color: "var(--color-text)" }}>
                            Student Records
                        </h3>
                        <p className="mt-1 text-sm font-semibold" style={{ color: "var(--color-muted)" }}>
                            {rows.length} registered {rows.length === 1 ? "account" : "accounts"} across BED and College.
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
                            <span>Import Students</span>
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
                            <span>Add New Student</span>
                        </button>
                    </div>
                </div>

                <UserAccountsTable rows={rows} idLabel="Student ID" noun="student" />

                <AddUserModal
                    open={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    defaultRole="student"
                    onSuccess={loadStudents}
                />

                <ImportUsersModal
                    open={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    role="student"
                    onSuccess={loadStudents}
                />
            </AdminModulePage>
        </AdminShell>
    );
}
