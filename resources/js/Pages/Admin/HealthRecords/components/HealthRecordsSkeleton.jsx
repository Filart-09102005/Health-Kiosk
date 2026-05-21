import { cardClassName, cardStyle } from "../utils/surface";
import ShimmerSkeleton from "./ShimmerSkeleton";

function StatCardSkeleton() {
    return (
        <div className={`${cardClassName} p-4`} style={cardStyle}>
            <div className="flex items-start justify-between gap-2">
                <ShimmerSkeleton className="h-7 w-7" />
                <ShimmerSkeleton className="h-5 w-14 rounded-full" />
            </div>
            <ShimmerSkeleton className="mt-4 h-7 w-20" />
            <ShimmerSkeleton className="mt-2 h-3 w-28" />
        </div>
    );
}

function AnalyticsCardSkeleton() {
    return (
        <div className={`${cardClassName} p-4`} style={cardStyle}>
            <ShimmerSkeleton className="h-4 w-36" />
            <div className="mt-5 flex h-40 items-center justify-center">
                <div className="relative h-32 w-32 rounded-full hk-skeleton-shimmer">
                    <div className="absolute inset-8 rounded-full" style={{ backgroundColor: "var(--color-card)" }} />
                </div>
            </div>
            <div className="mt-4 space-y-2">
                <ShimmerSkeleton className="h-3 w-full" />
                <ShimmerSkeleton className="h-3 w-3/4" />
            </div>
        </div>
    );
}

function FiltersSkeleton() {
    return (
        <section className={`space-y-4 ${cardClassName} p-5`} style={cardStyle}>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <ShimmerSkeleton className="h-11 w-full xl:max-w-xl" />
                <div className="flex gap-2">
                    <ShimmerSkeleton className="h-11 w-24" />
                    <ShimmerSkeleton className="h-11 w-36" />
                </div>
            </div>
            <div className="flex flex-wrap gap-2 rounded-2xl border p-1.5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                {Array.from({ length: 5 }).map((_, index) => (
                    <ShimmerSkeleton key={index} className="h-9 w-24" />
                ))}
            </div>
            <div className="rounded-2xl border p-4" style={{ backgroundColor: "color-mix(in srgb, var(--color-surface) 72%, transparent)", borderColor: "var(--color-border)" }}>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                    <div className="xl:col-span-2">
                        <ShimmerSkeleton className="h-3 w-24" />
                        <ShimmerSkeleton className="mt-2 h-11 w-full" />
                    </div>
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index}>
                            <ShimmerSkeleton className="h-3 w-24" />
                            <ShimmerSkeleton className="mt-2 h-11 w-full" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default function HealthRecordsSkeleton() {
    return (
        <div className="mt-6 space-y-6" aria-busy="true" aria-label="Loading health records">
            <section className={`${cardClassName} p-5 sm:p-6`} style={cardStyle}>
                <ShimmerSkeleton className="h-3 w-48" />
                <div className="mt-5 flex items-start gap-4">
                    <ShimmerSkeleton className="h-12 w-12" />
                    <div className="min-w-0 flex-1">
                        <ShimmerSkeleton className="h-7 w-56 max-w-full" />
                        <ShimmerSkeleton className="mt-3 h-4 w-[42rem] max-w-full" />
                        <ShimmerSkeleton className="mt-2 h-4 w-[32rem] max-w-full" />
                    </div>
                </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                    <StatCardSkeleton key={index} />
                ))}
            </section>

            <section>
                <ShimmerSkeleton className="h-5 w-40" />
                <ShimmerSkeleton className="mt-2 h-3 w-80 max-w-full" />
                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <AnalyticsCardSkeleton key={index} />
                    ))}
                </div>
            </section>

            <FiltersSkeleton />

            <article className={`${cardClassName} p-5`} style={cardStyle}>
                <ShimmerSkeleton className="h-10 w-full max-w-md" />
                <div className="mt-5 space-y-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <ShimmerSkeleton key={index} className="h-12 w-full" />
                    ))}
                </div>
            </article>
        </div>
    );
}
