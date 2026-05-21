import { Building2, MailCheck, ScanBarcode, Stethoscope } from "lucide-react";
import AdminShell from "../../components/AdminShell";
import AdminModulePage from "../../components/AdminModulePage";

const rows = [
    {
        id: 1,
        firstname: "Faculty",
        lastname: "User",
        student_id: "F-1001",
        email: "faculty.user@smcbi.edu.ph",
        email_verified_at: "2026-05-19 07:44",
        role: "teacher",
        department: "FACULTY",
        age: 34,
        gender: "Female",
        barcode: "F-1001",
        created_at: "2026-05-16",
        updated_at: "2026-05-19",
    },
    {
        id: 2,
        firstname: "Teacher",
        lastname: "Santos",
        student_id: "F-1002",
        email: "teacher.santos@smcbi.edu.ph",
        email_verified_at: "2026-05-17 09:15",
        role: "teacher",
        department: "BED",
        age: 41,
        gender: "Male",
        barcode: "F-1002",
        created_at: "2026-05-17",
        updated_at: "2026-05-19",
    },
    {
        id: 3,
        firstname: "Teacher",
        lastname: "Dela Cruz",
        student_id: "F-1003",
        email: "teacher.dc@smcbi.edu.ph",
        email_verified_at: "Pending",
        role: "teacher",
        department: "FACULTY",
        age: 29,
        gender: "Female",
        barcode: "F-1003",
        created_at: "2026-05-15",
        updated_at: "2026-05-18",
    },
];

export default function Teachers({ navigate }) {
    return (
        <AdminShell navigate={navigate} eyebrow="User Management" title="Teachers">
            <AdminModulePage
                icon={Stethoscope}
                eyebrow="Teacher accounts"
                title="Teachers"
                description="Manage teacher and faculty kiosk access, verification, department assignment, and barcode identity."
                stats={[
                    { label: "Teachers", value: "42", caption: "Registered accounts", icon: Stethoscope },
                    { label: "Verified", value: "39", caption: "Can access kiosk", icon: MailCheck },
                    { label: "Faculty", value: "31", caption: "Department split", icon: Building2 },
                    { label: "Barcodes", value: "42", caption: "Unique IDs", icon: ScanBarcode },
                ]}
                columns={["ID", "Firstname", "Lastname", "Student ID", "Email", "Email Verified At", "Role", "Department", "Age", "Gender", "Barcode", "Created At", "Updated At"]}
                rows={rows}
            />
        </AdminShell>
    );
}
