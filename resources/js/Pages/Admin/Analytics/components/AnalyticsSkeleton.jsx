import ShimmerSkeleton from "./ShimmerSkeleton";
import { cardClassName, cardStyle } from "../utils/surface";

const insightWidths = ["w-44", "w-36", "w-44", "w-40"];
const barHeights = ["h-24", "h-32", "h-20", "h-36", "h-28", "h-40", "h-24"];
const heatmapRows = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function HeaderSkeleton() {
    return (
        <section className={`${cardClassName} p-5 sm:p-6`} style={cardStyle}>
            <div className="flex items-center gap-1">
                <ShimmerSkeleton className="h-3 w-12" />
                <ShimmerSkeleton className="h-3 w-3" />
                <ShimmerSkeleton className="h-3 w-36" />
            </div>
            <div className="mt-4 flex items-start gap-4">
                <ShimmerSkeleton className="h-12 w-12" />
                <div className="min-w-0 flex-1">
                    <ShimmerSkeleton className="h-7 w-64 max-w-full" />
                    <ShimmerSkeleton className="mt-3 h-4 w-[42rem] max-w-full" />
                    <ShimmerSkeleton className="mt-2 h-4 w-[34rem] max-w-full" />
                </div>
            </div>
        </section>
    );
}

function InsightCardSkeleton({ index }) {
    return (
        <div className={`${cardClassName} p-4`} style={cardStyle}>
            <ShimmerSkeleton className={`h-3 ${insightWidths[index] || "w-40"} max-w-full`} />
            <ShimmerSkeleton className="mt-3 h-6 w-28" />
            <ShimmerSkeleton className="mt-3 h-3 w-full" />
            <ShimmerSkeleton className="mt-2 h-3 w-3/4" />
            <ShimmerSkeleton className="mt-4 h-4 w-36" />
        </div>
    );
}

function SectionTitleSkeleton({ titleWidth = "w-44", descriptionWidth = "w-96" }) {
    return (
        <div className="mb-4">
            <ShimmerSkeleton className={`h-5 ${titleWidth}`} />
            <ShimmerSkeleton className={`mt-2 h-3 ${descriptionWidth} max-w-full`} />
        </div>
    );
}

function ChartCardSkeleton({ variant = "line", className = "" }) {
    return (
        <article className={`${cardClassName} p-5 ${className}`} style={cardStyle}>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <ShimmerSkeleton className="h-4 w-40" />
                    <ShimmerSkeleton className="mt-2 h-3 w-64 max-w-full" />
                </div>
                {variant === "period" ? <ShimmerSkeleton className="h-8 w-32 rounded-full" /> : null}
            </div>
            {variant === "donut" ? <DonutChartSkeleton /> : null}
            {variant === "alerts" ? <AlertsChartSkeleton /> : null}
            {variant === "bars" ? <BarsChartSkeleton /> : null}
            {variant === "line" ? <LineChartSkeleton /> : null}
            {variant === "period" ? <PeriodChartSkeleton /> : null}
            {variant === "heatmap" ? <HeatmapChartSkeleton /> : null}
        </article>
    );
}

function DonutChartSkeleton() {
    return (
        <div className="flex h-[300px] items-center justify-center gap-8">
            <div className="relative h-36 w-36 rounded-full hk-skeleton-shimmer">
                <div className="absolute inset-10 rounded-full" style={{ backgroundColor: "var(--color-card)" }} />
            </div>
            <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <ShimmerSkeleton className="h-3 w-3 rounded-full" />
                        <ShimmerSkeleton className="h-3 w-24" />
                        <ShimmerSkeleton className="h-3 w-10" />
                    </div>
                ))}
            </div>
        </div>
    );
}

function AlertsChartSkeleton() {
    return (
        <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="rounded-xl border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                    <div className="flex items-center justify-between gap-3">
                        <ShimmerSkeleton className="h-3 w-44 max-w-[70%]" />
                        <ShimmerSkeleton className="h-5 w-10 rounded-full" />
                    </div>
                    <ShimmerSkeleton className="mt-3 h-2 w-full rounded-full" />
                </div>
            ))}
        </div>
    );
}

function BarsChartSkeleton() {
    return (
        <div className="flex h-72 items-end gap-3 border-b border-l px-4 pb-4" style={{ borderColor: "var(--color-border)" }}>
            {barHeights.map((height, index) => (
                <div key={index} className="flex flex-1 flex-col items-center justify-end gap-2">
                    <ShimmerSkeleton className={`w-full rounded-t-xl ${height}`} />
                    <ShimmerSkeleton className="h-3 w-8" />
                </div>
            ))}
        </div>
    );
}

function LineChartSkeleton() {
    return (
        <div className="h-72 rounded-xl border p-4" style={{ borderColor: "var(--color-border)" }}>
            <div className="grid h-full grid-rows-5 gap-4">
                {Array.from({ length: 5 }).map((_, index) => (
                    <ShimmerSkeleton key={index} className="h-px w-full rounded-none" />
                ))}
            </div>
            <div className="-mt-40 space-y-5">
                <ShimmerSkeleton className="ml-4 h-3 w-1/3 rotate-[-8deg]" />
                <ShimmerSkeleton className="ml-24 h-3 w-1/2 rotate-[7deg]" />
                <ShimmerSkeleton className="ml-12 h-3 w-2/3 rotate-[-5deg]" />
            </div>
        </div>
    );
}

function PeriodChartSkeleton() {
    return (
        <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="rounded-xl border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                        <ShimmerSkeleton className="h-3 w-24" />
                        <ShimmerSkeleton className="mt-3 h-6 w-16" />
                    </div>
                ))}
            </div>
            <BarsChartSkeleton />
        </div>
    );
}

function HeatmapChartSkeleton() {
    return (
        <div>
            <div className="mb-5 grid gap-3 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="rounded-xl border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                        <ShimmerSkeleton className="h-6 w-16" />
                        <ShimmerSkeleton className="mt-2 h-3 w-28" />
                    </div>
                ))}
            </div>
            <div className="border-t pt-4" style={{ borderColor: "var(--color-border)" }}>
                <div className="grid grid-cols-[2.5rem_repeat(7,minmax(0,1fr))] gap-1.5">
                    <span />
                    {Array.from({ length: 7 }).map((_, index) => (
                        <ShimmerSkeleton key={index} className="mx-auto h-3 w-8" />
                    ))}
                    {heatmapRows.map((day) => (
                        <div key={day} className="contents">
                            <ShimmerSkeleton className="my-auto ml-auto h-3 w-7" />
                            {Array.from({ length: 7 }).map((_, index) => (
                                <ShimmerSkeleton key={`${day}-${index}`} className="h-9 w-full rounded-lg" />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
                <ShimmerSkeleton className="h-3 w-8" />
                <ShimmerSkeleton className="h-2 flex-1 rounded-sm" />
                <ShimmerSkeleton className="h-3 w-8" />
            </div>
        </div>
    );
}

export default function AnalyticsSkeleton() {
    return (
        <div className="mt-6 space-y-6" aria-busy="true" aria-label="Loading measurement analytics">
            <HeaderSkeleton />

            <section>
                <SectionTitleSkeleton titleWidth="w-40" descriptionWidth="w-[28rem]" />
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <InsightCardSkeleton key={index} index={index} />
                    ))}
                </div>
            </section>

            <section>
                <SectionTitleSkeleton titleWidth="w-48" descriptionWidth="w-[34rem]" />
                <div className="grid gap-4 xl:grid-cols-2">
                    <ChartCardSkeleton variant="donut" />
                    <ChartCardSkeleton variant="alerts" />
                    <ChartCardSkeleton variant="line" />
                    <ChartCardSkeleton variant="bars" />
                    <ChartCardSkeleton variant="line" />
                    <ChartCardSkeleton variant="line" />
                    <ChartCardSkeleton variant="period" />
                    <ChartCardSkeleton variant="period" />
                    <ChartCardSkeleton variant="heatmap" className="xl:col-span-2" />
                </div>
            </section>
        </div>
    );
}
