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

            <FiltersSkeleton />
            <TableSkeleton />
        </div>
    );
}

