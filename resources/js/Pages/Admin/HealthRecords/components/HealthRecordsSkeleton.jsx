import { cardClassName, cardStyle } from "../utils/surface";
import ShimmerSkeleton from "./ShimmerSkeleton";

const quickFilterWidths = ["w-24", "w-16", "w-24", "w-24", "w-16"];
const tableColumnWidths = [
    "w-20",
    "w-40",
    "w-16",
    "w-14",
    "w-14",
    "w-14",
    "w-16",
    "w-16",
    "w-14",
    "w-20",
    "w-24",
    "w-28",
    "w-20",
];

function StatCardSkeleton() {
    return (
        <div className={`${cardClassName} p-4`} style={cardStyle}>
            <div className="flex items-start justify-between gap-2">
                <ShimmerSkeleton className="h-10 w-10" />
                <ShimmerSkeleton className="h-5 w-14 rounded-full" />
            </div>
            <ShimmerSkeleton className="mt-4 h-8 w-20" />
            <ShimmerSkeleton className="mt-2 h-3 w-32" />
        </div>
    );
}

function DistributionCardSkeleton() {
    return (
        <div className={`${cardClassName} p-4`} style={cardStyle}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <ShimmerSkeleton className="h-4 w-48" />
                    <ShimmerSkeleton className="mt-2 h-3 w-40" />
                </div>
                <div className="flex flex-col items-end">
                    <ShimmerSkeleton className="h-7 w-12" />
                    <ShimmerSkeleton className="mt-2 h-3 w-20" />
                </div>
            </div>
            <div className="mt-5 grid items-center gap-5 sm:grid-cols-[8rem_1fr]">
                <div className="relative mx-auto h-28 w-28 rounded-full hk-skeleton-shimmer">
                    <div className="absolute inset-8 rounded-full" style={{ backgroundColor: "var(--color-card)" }} />
                </div>
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="grid grid-cols-[4rem_1fr_4.2rem] items-center gap-3">
                            <div className="flex items-center gap-2">
                                <ShimmerSkeleton className="h-2.5 w-2.5 rounded-sm" />
                                <ShimmerSkeleton className="h-3 w-10" />
                            </div>
                            <ShimmerSkeleton className="h-2 w-full rounded-full" />
                            <ShimmerSkeleton className="ml-auto h-4 w-12" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function AlertsCardSkeleton() {
    return (
        <div className={`${cardClassName} p-4`} style={cardStyle}>
            <div className="flex items-center gap-2">
                <ShimmerSkeleton className="h-4 w-4" />
                <ShimmerSkeleton className="h-4 w-36" />
            </div>
            <ul className="mt-4 space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                    <li key={index} className="flex items-center justify-between rounded-xl border px-3 py-2.5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                        <ShimmerSkeleton className="h-3 w-40 max-w-[70%]" />
                        <ShimmerSkeleton className="h-3 w-6" />
                    </li>
                ))}
            </ul>
        </div>
    );
}

function FiltersSkeleton() {
    return (
        <section className={`space-y-4 ${cardClassName} p-5`} style={cardStyle}>
            <div className="space-y-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <ShimmerSkeleton className="h-11 w-full xl:max-w-xl" />
                    <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                        <ShimmerSkeleton className="h-11 w-28" />
                        <ShimmerSkeleton className="h-11 w-24" />
                        <ShimmerSkeleton className="h-11 w-20" />
                        <ShimmerSkeleton className="h-11 w-20" />
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 rounded-2xl border p-1.5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                    {quickFilterWidths.map((width, index) => (
                        <ShimmerSkeleton key={index} className={`h-9 ${width}`} />
                    ))}
                </div>
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

function TableSkeleton() {
    return (
        <article className={`${cardClassName} overflow-hidden p-5`} style={cardStyle}>
            <ShimmerSkeleton className="h-5 w-40" />
            <ShimmerSkeleton className="mt-2 h-3 w-72 max-w-full" />
            <div className="mt-4 max-h-[32rem] overflow-hidden rounded-xl border" style={{ borderColor: "var(--color-border)" }}>
                <div className="w-full min-w-[1200px]">
                    <div className="grid border-b px-3 py-3" style={{ borderColor: "var(--color-border)", gridTemplateColumns: "6rem 12rem 5rem 4.5rem 4.5rem 4.5rem 5.5rem 5.5rem 4.5rem 6rem 7rem 8rem 5rem" }}>
                        {tableColumnWidths.map((width, index) => (
                            <ShimmerSkeleton key={index} className={`h-3 ${width} max-w-full`} />
                        ))}
                    </div>
                    {Array.from({ length: 15 }).map((_, rowIndex) => (
                        <div key={rowIndex} className="grid items-center border-b px-3 py-3.5" style={{ borderColor: "var(--color-border)", gridTemplateColumns: "6rem 12rem 5rem 4.5rem 4.5rem 4.5rem 5.5rem 5.5rem 4.5rem 6rem 7rem 8rem 5rem" }}>
                            <ShimmerSkeleton className="h-4 w-20" />
                            <div>
                                <ShimmerSkeleton className="h-4 w-32" />
                                <ShimmerSkeleton className="mt-2 h-3 w-24" />
                            </div>
                            <ShimmerSkeleton className="h-3 w-14" />
                            <ShimmerSkeleton className="h-4 w-12" />
                            <ShimmerSkeleton className="h-4 w-14" />
                            <ShimmerSkeleton className="h-4 w-12" />
                            <ShimmerSkeleton className="h-4 w-14" />
                            <ShimmerSkeleton className="h-4 w-14" />
                            <ShimmerSkeleton className="h-4 w-10" />
                            <ShimmerSkeleton className="h-6 w-16 rounded-full" />
                            <ShimmerSkeleton className="h-6 w-20 rounded-full" />
                            <div>
                                <ShimmerSkeleton className="h-3 w-24" />
                                <ShimmerSkeleton className="mt-2 h-5 w-20 rounded-full" />
                            </div>
                            <ShimmerSkeleton className="h-9 w-9" />
                        </div>
                    ))}
                </div>
            </div>
            <div className="-mx-5 -mb-5 mt-5 flex items-center justify-between border-t px-5 py-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <ShimmerSkeleton className="h-9 w-24" />
                <div className="flex items-center gap-2">
                    <ShimmerSkeleton className="h-9 w-9" />
                    <ShimmerSkeleton className="h-9 w-9" />
                    <ShimmerSkeleton className="h-9 w-9" />
                </div>
                <ShimmerSkeleton className="h-9 w-24" />
            </div>
        </article>
    );
}

export default function HealthRecordsSkeleton() {
    return (
        <div className="mt-6 space-y-6" aria-busy="true" aria-label="Loading health records">
            <section className={`${cardClassName} p-5 sm:p-6`} style={cardStyle}>
                <div className="flex items-center gap-1">
                    <ShimmerSkeleton className="h-3 w-12" />
                    <ShimmerSkeleton className="h-3 w-3" />
                    <ShimmerSkeleton className="h-3 w-24" />
                </div>
                <div className="mt-4 flex items-start gap-4">
                    <ShimmerSkeleton className="h-12 w-12" />
                    <div className="min-w-0 flex-1">
                        <ShimmerSkeleton className="h-7 w-48 max-w-full" />
                        <ShimmerSkeleton className="mt-3 h-4 w-[38rem] max-w-full" />
                        <ShimmerSkeleton className="mt-2 h-4 w-[30rem] max-w-full" />
                    </div>
                </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <StatCardSkeleton key={index} />
                ))}
            </section>

            <section>
                <ShimmerSkeleton className="h-5 w-40" />
                <ShimmerSkeleton className="mt-2 h-3 w-80 max-w-full" />
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <DistributionCardSkeleton />
                    <AlertsCardSkeleton />
                </div>
            </section>

            <FiltersSkeleton />
            <TableSkeleton />
        </div>
    );
}
