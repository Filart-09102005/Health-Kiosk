import ShimmerSkeleton from "./ShimmerSkeleton";
import { cardClassName, cardStyle } from "../utils/surface";

export default function AnalyticsSkeleton() {
    return (
        <div className="mt-6 space-y-6" aria-busy="true" aria-label="Loading measurement analytics">
            {/* Header */}
            <section className={`${cardClassName} p-5 sm:p-6`} style={cardStyle}>
                <ShimmerSkeleton className="h-3 w-32" />
                <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <ShimmerSkeleton className="h-8 w-72 max-w-full" />
                        <ShimmerSkeleton className="mt-4 h-4 w-[28rem] max-w-full" />
                        <ShimmerSkeleton className="mt-2 h-3 w-[22rem] max-w-full" />
                    </div>
                    <ShimmerSkeleton className="h-8 w-56 rounded-full" />
                </div>
            </section>

            {/* Filters */}
            <section className={`${cardClassName} p-2 px-3`} style={cardStyle}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <ShimmerSkeleton className="h-10 w-64 rounded-xl" />
                        <ShimmerSkeleton className="h-10 w-32 rounded-xl" />
                        <ShimmerSkeleton className="h-10 w-32 rounded-xl" />
                    </div>
                    <div className="flex items-center gap-2">
                        <ShimmerSkeleton className="h-10 w-24 rounded-xl" />
                        <ShimmerSkeleton className="h-10 w-24 rounded-xl" />
                    </div>
                </div>
            </section>

            {/* Summary Cards */}
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={`${cardClassName} p-5`} style={cardStyle}>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <ShimmerSkeleton className="h-8 w-16" />
                                <ShimmerSkeleton className="mt-2 h-4 w-32" />
                            </div>
                            <ShimmerSkeleton className="h-10 w-10 rounded-xl" />
                        </div>
                        <ShimmerSkeleton className="mt-3 h-3 w-40" />
                    </div>
                ))}
            </section>

            {/* Decision & Asides */}
            <section>
                <div className="grid items-stretch gap-4 2xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                    <div className={`${cardClassName} p-5`} style={cardStyle}>
                        <ShimmerSkeleton className="h-5 w-40" />
                        <ShimmerSkeleton className="mt-2 h-3 w-64" />
                        <div className="mt-8 flex h-72 items-center justify-center">
                            <ShimmerSkeleton className="h-56 w-56 rounded-full" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-4">
                        <div className={`${cardClassName} flex-1 p-5`} style={cardStyle}>
                            <ShimmerSkeleton className="h-3 w-24" />
                            <ShimmerSkeleton className="mt-3 h-5 w-40" />
                            <ShimmerSkeleton className="mt-2 h-3 w-full" />
                            <div className="mt-6 flex h-32 items-center gap-6">
                                <ShimmerSkeleton className="h-28 w-28 rounded-full" />
                                <div className="space-y-3">
                                    <ShimmerSkeleton className="h-3 w-32" />
                                    <ShimmerSkeleton className="h-3 w-24" />
                                </div>
                            </div>
                        </div>
                        <div className={`${cardClassName} flex-1 p-5`} style={cardStyle}>
                            <ShimmerSkeleton className="h-3 w-24" />
                            <ShimmerSkeleton className="mt-3 h-5 w-48" />
                            <div className="mt-6 space-y-3">
                                <ShimmerSkeleton className="h-12 w-full rounded-xl" />
                                <ShimmerSkeleton className="h-12 w-full rounded-xl" />
                                <ShimmerSkeleton className="h-12 w-full rounded-xl" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Panel Insights */}
            <section>
                <ShimmerSkeleton className="mb-4 h-5 w-44" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className={`${cardClassName} p-4`} style={cardStyle}>
                            <ShimmerSkeleton className="h-3 w-24" />
                            <ShimmerSkeleton className="mt-2 h-6 w-16" />
                            <ShimmerSkeleton className="mt-3 h-3 w-full" />
                            <ShimmerSkeleton className="mt-1 h-3 w-4/5" />
                        </div>
                    ))}
                </div>
            </section>

            {/* Distribution Charts */}
            <section>
                <div className="mb-4">
                    <ShimmerSkeleton className="h-5 w-64" />
                    <ShimmerSkeleton className="mt-2 h-3 w-96" />
                </div>
                <div className="grid gap-4 xl:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className={`${cardClassName} p-5`} style={cardStyle}>
                            <ShimmerSkeleton className="h-5 w-40" />
                            <ShimmerSkeleton className="mt-2 h-3 w-56" />
                            <div className="mt-6 flex h-52 items-end gap-2 border-b border-l pb-2 pl-2">
                                {Array.from({ length: 5 }).map((_, j) => (
                                    <ShimmerSkeleton key={j} className="w-full rounded-t-md" style={{ height: `${Math.random() * 60 + 20}%` }} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Academic Comparison */}
            <section className={`${cardClassName} p-5`} style={cardStyle}>
                <ShimmerSkeleton className="mb-4 h-6 w-64" />
                <div className="mb-6 grid grid-cols-3 gap-2">
                    <ShimmerSkeleton className="h-16 w-full rounded-xl" />
                    <ShimmerSkeleton className="h-16 w-full rounded-xl" />
                    <ShimmerSkeleton className="h-16 w-full rounded-xl" />
                </div>
                <ShimmerSkeleton className="h-72 w-full rounded-xl" />
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <ShimmerSkeleton key={i} className="h-12 w-full rounded-xl" />
                    ))}
                </div>
            </section>

            {/* Academic Risk */}
            <section className={`${cardClassName} p-5`} style={cardStyle}>
                <ShimmerSkeleton className="mb-4 h-6 w-72" />
                <div className="mb-6 grid grid-cols-2 gap-2">
                    <ShimmerSkeleton className="h-16 w-full rounded-xl" />
                    <ShimmerSkeleton className="h-16 w-full rounded-xl" />
                </div>
                <ShimmerSkeleton className="h-72 w-full rounded-xl" />
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <ShimmerSkeleton key={i} className="h-12 w-full rounded-xl" />
                    ))}
                </div>
            </section>

            {/* Trends */}
            <section className={`${cardClassName} p-5`} style={cardStyle}>
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <ShimmerSkeleton className="h-6 w-48" />
                        <ShimmerSkeleton className="mt-2 h-3 w-64" />
                    </div>
                    <ShimmerSkeleton className="h-10 w-48 rounded-xl" />
                </div>
                <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <ShimmerSkeleton key={i} className="h-20 w-full rounded-xl" />
                    ))}
                </div>
                <ShimmerSkeleton className="h-72 w-full rounded-xl" />
            </section>

            {/* Follow up Table */}
            <section className={`${cardClassName} p-5`} style={cardStyle}>
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <ShimmerSkeleton className="h-6 w-56" />
                        <ShimmerSkeleton className="mt-2 h-3 w-72" />
                    </div>
                    <ShimmerSkeleton className="h-10 w-64 rounded-xl" />
                </div>
                <ShimmerSkeleton className="h-96 w-full rounded-xl" />
            </section>
        </div>
    );
}
