import { Stethoscope } from "lucide-react";
import AdminShell from "../../components/AdminShell";
import AdminModulePage from "../../components/AdminModulePage";
import TeachersTable from "./components/TeachersTable";

const rows = [
    { id: 1, firstname: "Faculty", lastname: "User", student_id: "F-1001", email: "faculty.user@smcbi.edu.ph", email_verified_at: "2026-05-19 07:44", role: "teacher", department: "TEACHER", age: 34, gender: "Female", barcode: "F-1001", created_at: "2026-05-16", updated_at: "2026-05-19" },
    { id: 2, firstname: "Teacher", lastname: "Santos", student_id: "F-1002", email: "teacher.santos@smcbi.edu.ph", email_verified_at: "2026-05-17 09:15", role: "teacher", department: "TEACHER", age: 41, gender: "Male", barcode: "F-1002", created_at: "2026-05-17", updated_at: "2026-05-19" },
    { id: 3, firstname: "Teacher", lastname: "Dela Cruz", student_id: "F-1003", email: "teacher.dc@smcbi.edu.ph", email_verified_at: "Pending", role: "teacher", department: "TEACHER", age: 29, gender: "Female", barcode: "F-1003", created_at: "2026-05-15", updated_at: "2026-05-18" },
    { id: 4, firstname: "Lea", lastname: "Mendoza", student_id: "F-1004", email: "lea.mendoza@smcbi.edu.ph", email_verified_at: "2026-05-16 10:05", role: "teacher", department: "TEACHER", age: 37, gender: "Female", barcode: "F-1004", created_at: "2026-05-16", updated_at: "2026-05-18" },
    { id: 5, firstname: "Ramon", lastname: "Garcia", student_id: "F-1005", email: "ramon.garcia@smcbi.edu.ph", email_verified_at: "2026-05-15 08:50", role: "teacher", department: "TEACHER", age: 45, gender: "Male", barcode: "F-1005", created_at: "2026-05-15", updated_at: "2026-05-17" },
    { id: 6, firstname: "Catherine", lastname: "Villanueva", student_id: "F-1006", email: "catherine.villanueva@smcbi.edu.ph", email_verified_at: "Pending", role: "teacher", department: "TEACHER", age: 33, gender: "Female", barcode: "F-1006", created_at: "2026-05-14", updated_at: "2026-05-14" },
    { id: 7, firstname: "Noel", lastname: "Aquino", student_id: "F-1007", email: "noel.aquino@smcbi.edu.ph", email_verified_at: "2026-05-13 13:20", role: "teacher", department: "TEACHER", age: 40, gender: "Male", barcode: "F-1007", created_at: "2026-05-13", updated_at: "2026-05-16" },
    { id: 8, firstname: "Mariel", lastname: "Domingo", student_id: "F-1008", email: "mariel.domingo@smcbi.edu.ph", email_verified_at: "2026-05-12 09:44", role: "teacher", department: "TEACHER", age: 31, gender: "Female", barcode: "F-1008", created_at: "2026-05-12", updated_at: "2026-05-15" },
    { id: 9, firstname: "Patrick", lastname: "Rivera", student_id: "F-1009", email: "patrick.rivera@smcbi.edu.ph", email_verified_at: "2026-05-11 14:08", role: "teacher", department: "TEACHER", age: 39, gender: "Male", barcode: "F-1009", created_at: "2026-05-11", updated_at: "2026-05-13" },
    { id: 10, firstname: "Aileen", lastname: "Castro", student_id: "F-1010", email: "aileen.castro@smcbi.edu.ph", email_verified_at: "2026-05-10 11:33", role: "teacher", department: "TEACHER", age: 42, gender: "Female", barcode: "F-1010", created_at: "2026-05-10", updated_at: "2026-05-12" },
    { id: 11, firstname: "Victor", lastname: "Lopez", student_id: "F-1011", email: "victor.lopez@smcbi.edu.ph", email_verified_at: "Pending", role: "teacher", department: "TEACHER", age: 36, gender: "Male", barcode: "F-1011", created_at: "2026-05-09", updated_at: "2026-05-10" },
    { id: 12, firstname: "Grace", lastname: "Fernandez", student_id: "F-1012", email: "grace.fernandez@smcbi.edu.ph", email_verified_at: "2026-05-08 16:12", role: "teacher", department: "TEACHER", age: 44, gender: "Female", barcode: "F-1012", created_at: "2026-05-08", updated_at: "2026-05-09" },
];

export default function Teachers({ navigate }) {
    return (
        <AdminShell navigate={navigate} eyebrow="User Management" title="Teachers">
            <AdminModulePage
                icon={Stethoscope}
                eyebrow="Teacher accounts"
                title="Teachers"
                description="Manage teacher kiosk access, verification, department assignment, and barcode identity."
                showHeaderActions={false}
            >
                <TeachersTable rows={rows} />
            </AdminModulePage>
        </AdminShell>
    );
}
