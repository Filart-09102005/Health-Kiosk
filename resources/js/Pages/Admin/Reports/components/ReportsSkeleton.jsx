import ShimmerSkeleton from "./ShimmerSkeleton";

function HeaderSkeleton() {
    return (
        <section className="rounded-[1.25rem] border p-6 shadow-xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="flex items-start gap-4">
                <ShimmerSkeleton className="h-14 w-14" />
                <div className="min-w-0 flex-1">
                    <ShimmerSkeleton className="h-3 w-32" />
                    <ShimmerSkeleton className="mt-3 h-9 w-64 max-w-full" />
                    <ShimmerSkeleton className="mt-3 h-4 w-[28rem] max-w-full" />
                </div>
            </div>
        </section>
    );
}

function ToolbarSkeleton() {
    return (
        <section className="rounded-[1.25rem] border p-4 hk-admin-card" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center">
                <div className="min-w-0 flex-1">
                    <div className="grid gap-3 rounded-[1.25rem] border p-3 lg:grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                        <div className="flex shrink-0 items-center gap-2">
                            <ShimmerSkeleton className="h-4 w-4" />
                            <ShimmerSkeleton className="h-4 w-10" />
                        </div>
                        <div className="grid min-w-0 gap-2 sm:grid-cols-2">
                            <ShimmerSkeleton className="h-11 w-full" />
                            <ShimmerSkeleton className="h-11 w-full" />
                        </div>
                        <ShimmerSkeleton className="h-4 w-6" />
                        <div className="grid min-w-0 gap-2 sm:grid-cols-2">
                            <ShimmerSkeleton className="h-11 w-full" />
                            <ShimmerSkeleton className="h-11 w-full" />
                        </div>
                    </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-3">
                    <ShimmerSkeleton className="h-12 w-40" />
                    <ShimmerSkeleton className="h-12 w-12" />
                </div>
            </div>
        </section>
    );
}

function EmptyStateSkeleton() {
    return (
        <section className="flex min-h-[22rem] flex-col items-center justify-center rounded-[1.25rem] border p-8 text-center shadow-xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <ShimmerSkeleton className="h-14 w-14" />
            <ShimmerSkeleton className="mt-4 h-6 w-56 max-w-full" />
            <ShimmerSkeleton className="mt-3 h-4 w-[28rem] max-w-full" />
            <ShimmerSkeleton className="mt-2 h-4 w-[22rem] max-w-full" />
        </section>
    );
}

export default function ReportsSkeleton() {
    return (
        <div className="mt-5 space-y-5" aria-busy="true" aria-label="Loading reports">
            <HeaderSkeleton />
            <ToolbarSkeleton />
            <EmptyStateSkeleton />
        </div>
    );
}
