import { SkeletonBlock } from "../../Dashboard/components/DashboardSkeleton.jsx";

const columns = ["Actor", "Action", "Area", "Status", "Time", "Details"];

export default function ActivityLogsSkeleton() {
    return (
        <div className="mt-5 space-y-5" aria-busy="true" aria-label="Loading activity logs page">
            <section className="rounded-[1.25rem] border p-5 hk-admin-card" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                        <SkeletonBlock className="h-12 w-12 shrink-0 rounded-[1rem]" />
                        <div className="min-w-0">
                            <SkeletonBlock className="h-3 w-36" />
                            <SkeletonBlock className="mt-3 h-9 w-56 max-w-full" />
                            <SkeletonBlock className="mt-3 h-4 w-[38rem] max-w-full" />
                        </div>
                    </div>
                </div>
            </section>

            <section className="rounded-[1.25rem] border p-5 hk-admin-card" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <SkeletonBlock className="h-6 w-28" />
                        <SkeletonBlock className="mt-2 h-4 w-80 max-w-full" />
                    </div>
                    <SkeletonBlock className="h-4 w-36" />
                </div>

                <div className="hk-reports-table-scroll max-h-[34rem] overflow-auto rounded-xl border" style={{ borderColor: "var(--color-border)" }}>
                    <table className="w-full min-w-[1040px] table-fixed text-left text-xs">
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
                                        <td key={column} className="border-b px-3 py-3.5" style={{ borderColor: "var(--color-border)" }}>
                                            <SkeletonBlock className={`h-4 ${columnIndex === 5 ? "w-44" : "w-24"} max-w-full`} />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                    <SkeletonBlock className="h-9 w-9 rounded-xl" />
                    <SkeletonBlock className="h-9 w-28 rounded-xl" />
                    <SkeletonBlock className="h-9 w-9 rounded-xl" />
                </div>
            </section>
        </div>
    );
}
