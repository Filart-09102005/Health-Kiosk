import { GraduationCap, MailCheck, ScanBarcode, UsersRound } from "lucide-react";
import AdminShell from "../../components/AdminShell";
import AdminModulePage from "../../components/AdminModulePage";

const rows = [
    {
        id: 1,
        firstname: "Hans Kurvey",
        lastname: "Filart",
        student_id: "C-230204",
        email: "hanskurveyfilart@smcbi.edu.ph",
        email_verified_at: "2026-05-19 08:10",
        role: "student",
        department: "COLLEGE",
        age: 21,
        gender: "Male",
        barcode: "C-230204",
        created_at: "2026-05-19",
        updated_at: "2026-05-19",
    },
    {
        id: 2,
        firstname: "Angela",
        lastname: "Cruz",
        student_id: "C-230205",
        email: "angela.cruz@smcbi.edu.ph",
        email_verified_at: "2026-05-18 14:22",
        role: "student",
        department: "BED",
        age: 17,
        gender: "Female",
        barcode: "C-230205",
        created_at: "2026-05-18",
        updated_at: "2026-05-19",
    },
    {
        id: 3,
        firstname: "Mark",
        lastname: "Reyes",
        student_id: "C-230206",
        email: "mark.reyes@smcbi.edu.ph",
        email_verified_at: "Pending",
        role: "student",
        department: "COLLEGE",
        age: 20,
        gender: "Male",
        barcode: "C-230206",
        created_at: "2026-05-17",
        updated_at: "2026-05-17",
    },
];

export default function Students({ navigate }) {
    return (
        <AdminShell navigate={navigate} eyebrow="User Management" title="Students">
            <AdminModulePage
                icon={UsersRound}
                eyebrow="Student accounts"
                title="Students"
                description="Manage student kiosk access, school email verification, barcode identity, and department grouping."
                stats={[
                    { label: "Students", value: "186", caption: "Registered accounts", icon: UsersRound },
                    { label: "Verified", value: "172", caption: "Can access kiosk", icon: MailCheck },
                    { label: "College", value: "118", caption: "Department split", icon: GraduationCap },
                    { label: "Barcodes", value: "186", caption: "Unique IDs", icon: ScanBarcode },
                ]}
                columns={["ID", "Firstname", "Lastname", "Student ID", "Email", "Email Verified At", "Role", "Department", "Age", "Gender", "Barcode", "Created At", "Updated At"]}
                rows={rows}
            />
        </AdminShell>
    );
}
