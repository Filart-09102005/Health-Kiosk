import ShimmerSkeleton from "./ShimmerSkeleton";

function HeaderSkeleton() {
    return (
        <section className="rounded-[14px] border p-5 shadow-xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex gap-4">
                    <ShimmerSkeleton className="h-12 w-12" />
                    <div>
                        <ShimmerSkeleton className="h-3 w-40" />
                        <ShimmerSkeleton className="mt-3 h-8 w-64" />
                        <ShimmerSkeleton className="mt-3 h-4 w-96 max-w-full" />
                    </div>
                </div>
            </div>
        </section>
    );
}

function StatsGridSkeleton() {
    return (
        <section className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-[14px] border p-5 shadow-sm" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                    <div className="flex items-start justify-between">
                        <div>
                            <ShimmerSkeleton className="h-4 w-24" />
                            <ShimmerSkeleton className="mt-3 h-10 w-16" />
                            <ShimmerSkeleton className="mt-2 h-3 w-32" />
                        </div>
                        <ShimmerSkeleton className="h-10 w-10" />
                    </div>
                </div>
            ))}
        </section>
    );
}

function ToolbarSkeleton() {
    return (
        <section className="rounded-[14px] border p-4 shadow-sm" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <ShimmerSkeleton className="h-11 w-full xl:max-w-md" />
                <div className="flex flex-wrap items-center gap-2">
                    <ShimmerSkeleton className="h-11 w-32" />
                    <ShimmerSkeleton className="h-11 w-32" />
                    <ShimmerSkeleton className="h-11 w-32" />
                    <ShimmerSkeleton className="h-11 w-24" />
                </div>
            </div>
        </section>
    );
}

function TableSkeleton() {
    return (
        <section className="rounded-[14px] border p-5 shadow-xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <ShimmerSkeleton className="h-6 w-48 mb-4" />
            <div className="max-h-[34rem] overflow-hidden rounded-[12px] border" style={{ borderColor: "var(--color-border)" }}>
                <table className="w-full min-w-[1180px] text-left text-sm">
                    <thead className="border-b" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                        <tr>
                            {Array.from({ length: 12 }).map((_, i) => (
                                <th key={i} className="px-3 py-4">
                                    <ShimmerSkeleton className="h-3 w-16" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: 8 }).map((_, rowIndex) => (
                            <tr key={rowIndex} className="border-b" style={{ borderColor: "var(--color-border)" }}>
                                {Array.from({ length: 12 }).map((_, colIndex) => (
                                    <td key={colIndex} className="px-3 py-4">
                                        <ShimmerSkeleton className="h-4 w-full max-w-[6rem]" />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

export default function AlertsSkeleton() {
    return (
        <div className="mt-6 space-y-6" aria-busy="true">
            <HeaderSkeleton />
            <StatsGridSkeleton />
            <ToolbarSkeleton />
            <TableSkeleton />
        </div>
    );
}
