import { SkeletonBlock } from "../../Dashboard/components/DashboardSkeleton.jsx";

const studentColumns = [
    "Firstname",
    "Lastname",
    "Student ID",
    "Email",
    "Role",
    "Department",
    "Age",
    "Gender",
    "Barcode",
    "Actions",
];

const teacherColumns = [
    "Firstname",
    "Lastname",
    "Teacher ID",
    "Email",
    "Role",
    "Department",
    "Age",
    "Gender",
    "Barcode",
    "Actions",
];

export default function UserAccountsSkeleton({ type = "students" }) {
    const isStudents = type === "students";
    const columns = isStudents ? studentColumns : teacherColumns;
    const statsCount = isStudents ? 3 : 0;

    return (
        <div className="mt-5 space-y-5" aria-busy="true" aria-label={`Loading ${isStudents ? "students" : "teachers"} page`}>
            <section className="rounded-[1.25rem] border p-5 hk-admin-card" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                        <SkeletonBlock className="h-12 w-12 shrink-0 rounded-[1rem]" />
                        <div className="min-w-0">
                            <SkeletonBlock className="h-3 w-36" />
                            <SkeletonBlock className="mt-3 h-9 w-48 max-w-full" />
                            <SkeletonBlock className="mt-3 h-4 w-[34rem] max-w-full" />
                        </div>
                    </div>
                </div>
            </section>

            {statsCount ? (
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: statsCount }).map((_, index) => (
                        <article key={index} className="rounded-[1.25rem] border p-5 shadow-sm" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <SkeletonBlock className="h-4 w-28" />
                                    <SkeletonBlock className="mt-3 h-9 w-16" />
                                </div>
                                <SkeletonBlock className="h-10 w-10 rounded-[0.875rem]" />
                            </div>
                            <SkeletonBlock className="mt-4 h-3 w-32" />
                        </article>
                    ))}
                </section>
            ) : null}

            <section className="rounded-[1.25rem] border p-5 hk-admin-card" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                <div className="mb-4 flex flex-col gap-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <SkeletonBlock className="h-6 w-24" />
                            <SkeletonBlock className="mt-2 h-4 w-72 max-w-full" />
                        </div>

                        <div className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)]">
                            <SkeletonBlock className="h-11 w-full min-w-0 rounded-xl lg:w-80" />
                        </div>
                    </div>
                </div>

                <div className="hk-reports-table-scroll max-h-[34rem] overflow-auto rounded-xl border" style={{ borderColor: "var(--color-border)" }}>
                    <table className="w-full min-w-[980px] table-fixed text-left text-xs">
                        <thead className="sticky top-0 z-10" style={{ backgroundColor: "var(--color-surface)" }}>
                            <tr>
                                {columns.map((column) => (
                                    <th key={column} className="border-b px-3 py-3" style={{ borderColor: "var(--color-border)" }}>
                                        <SkeletonBlock className="h-3 w-16" />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: 15 }).map((_, rowIndex) => (
                                <tr key={rowIndex}>
                                    {columns.map((column, columnIndex) => (
                                        <td key={column} className="border-b px-3 py-3" style={{ borderColor: "var(--color-border)" }}>
                                            {column === "Actions" ? (
                                                <div className="flex flex-col items-stretch gap-1.5">
                                                    <SkeletonBlock className="h-8 w-full rounded-[9px]" />
                                                    <SkeletonBlock className="h-8 w-full rounded-[9px]" />
                                                    <SkeletonBlock className="h-8 w-full rounded-[9px]" />
                                                </div>
                                            ) : (
                                                <SkeletonBlock className={`h-4 ${columnIndex === 3 ? "w-40" : "w-20"} max-w-full`} />
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <SkeletonBlock className="h-4 w-44" />
                    <div className="flex items-center gap-2">
                        <SkeletonBlock className="h-9 w-9 rounded-xl" />
                        <SkeletonBlock className="h-9 w-28 rounded-xl" />
                        <SkeletonBlock className="h-9 w-9 rounded-xl" />
                    </div>
                </div>
            </section>
        </div>
    );
}
