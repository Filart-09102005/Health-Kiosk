export const USER_DASHBOARD_SKELETON_MIN_MS = 600;

function SkeletonBlock({ className = "", style }) {
    return <div className={`hk-skeleton-shimmer rounded-xl ${className}`} style={style} aria-hidden="true" />;
}

function SkeletonCard({ children, className = "" }) {
    return (
        <article
            className={`rounded-[1.5rem] border shadow-xl ${className}`}
            style={{
                backgroundColor: "color-mix(in srgb, var(--color-card) 92%, transparent)",
                borderColor: "var(--color-border)",
            }}
        >
            {children}
        </article>
    );
}

function HeaderSkeleton() {
    return (
        <header
            className="rounded-[2rem] border px-4 py-4 shadow-2xl sm:px-5"
            style={{
                backgroundColor: "color-mix(in srgb, var(--color-card) 90%, transparent)",
                borderColor: "var(--color-border)",
            }}
        >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-4 text-left">
                    <SkeletonBlock className="h-14 w-14 rounded-2xl" />
                    <div className="min-w-0">
                        <SkeletonBlock className="h-3 w-32" />
                        <SkeletonBlock className="mt-2 h-6 w-64 max-w-full" />
                    </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-3">
                    <SkeletonBlock className="h-11 w-24 rounded-2xl" />
                    <SkeletonBlock className="h-11 w-36 rounded-2xl" />
                    <SkeletonBlock className="h-11 w-44 rounded-2xl" />
                    <SkeletonBlock className="h-11 w-11 rounded-2xl" />
                    <SkeletonBlock className="h-11 w-48 rounded-2xl" />
                </div>
            </div>
        </header>
    );
}

export default function DashboardSkeleton() {
    return (
        <main className="hk-page min-h-screen px-4 py-6" style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
            <div className="mx-auto max-w-7xl" aria-busy="true" aria-label="Loading user dashboard">
                <HeaderSkeleton />

                <section className="mt-8 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
                    <SkeletonCard className="overflow-hidden rounded-[2rem] p-6 md:p-8">
                        <SkeletonBlock className="h-3 w-40" />
                        <SkeletonBlock className="mt-4 h-10 w-[38rem] max-w-full" />
                        <SkeletonBlock className="mt-3 h-10 w-[32rem] max-w-full" />
                        <SkeletonBlock className="mt-5 h-4 w-[34rem] max-w-full" />
                        <SkeletonBlock className="mt-3 h-4 w-[28rem] max-w-full" />
                        <div className="mt-8 flex flex-wrap gap-3">
                            <SkeletonBlock className="h-14 w-40 rounded-2xl" />
                            <SkeletonBlock className="h-14 w-44 rounded-2xl" />
                            <SkeletonBlock className="h-14 w-48 rounded-2xl" />
                        </div>
                    </SkeletonCard>

                    <SkeletonCard className="rounded-[2rem] p-6">
                        <div className="flex items-start gap-3">
                            <SkeletonBlock className="h-11 w-11 rounded-2xl" />
                            <div className="min-w-0 flex-1">
                                <SkeletonBlock className="h-4 w-24" />
                                <SkeletonBlock className="mt-2 h-3 w-56 max-w-full" />
                            </div>
                        </div>
                        <div className="mt-5 grid gap-3">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div key={index} className="flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                                    <SkeletonBlock className="h-5 w-5 rounded-md" />
                                    <SkeletonBlock className="h-4 w-44 max-w-full" />
                                </div>
                            ))}
                        </div>
                    </SkeletonCard>
                </section>

                <section className="mt-6">
                    <SkeletonCard className="rounded-[2rem] p-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <SkeletonBlock className="h-4 w-40" />
                                <SkeletonBlock className="mt-2 h-4 w-28" />
                            </div>
                            <SkeletonBlock className="h-8 w-16" />
                        </div>
                        <SkeletonBlock className="mt-4 h-3 w-full rounded-full" />
                        <SkeletonBlock className="mt-4 h-4 w-[32rem] max-w-full" />
                        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <div key={index} className="flex items-center justify-between gap-3 rounded-2xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                                    <SkeletonBlock className="h-4 w-32" />
                                    <SkeletonBlock className="h-5 w-5 rounded-full" />
                                </div>
                            ))}
                        </div>
                    </SkeletonCard>
                </section>

                <section className="mt-8 border-t pt-6" style={{ borderColor: "var(--color-border)" }}>
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <SkeletonBlock className="h-3 w-36" />
                            <SkeletonBlock className="mt-3 h-7 w-64" />
                            <SkeletonBlock className="mt-3 h-4 w-[34rem] max-w-full" />
                        </div>
                        <SkeletonBlock className="h-9 w-40 rounded-full" />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <SkeletonCard key={index} className="p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <SkeletonBlock className="h-12 w-12 rounded-2xl" />
                                    <SkeletonBlock className="h-6 w-20 rounded-full" />
                                </div>
                                <SkeletonBlock className="mt-5 h-5 w-40" />
                                <SkeletonBlock className="mt-2 h-4 w-32" />
                                <div className="mt-5 space-y-4">
                                    <div className="flex items-end justify-between gap-3">
                                        <div className="flex-1">
                                            <SkeletonBlock className="h-3 w-24" />
                                            <SkeletonBlock className="mt-2 h-8 w-24" />
                                        </div>
                                        <SkeletonBlock className="h-4 w-8" />
                                    </div>
                                </div>
                            </SkeletonCard>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
