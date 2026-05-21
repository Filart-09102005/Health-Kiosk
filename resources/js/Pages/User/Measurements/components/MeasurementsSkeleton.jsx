import { motion, useReducedMotion } from "framer-motion";

const measurementCardWidths = ["w-36", "w-28", "w-24", "w-24"];
const chartBarHeights = [42, 58, 36, 72, 54, 82, 64];
const measurementCardIndexes = [0, 1, 2, 3];
const historyRows = [0, 1, 2];
const analyticsLegendItems = [0, 1, 2, 3];

export const MEASUREMENTS_SKELETON_MIN_MS = 600;

export const MEASUREMENTS_SKELETON_SECTIONS = {
    header: true,
    hero: true,
    cards: true,
    analytics: false,
    history: false,
    actions: true,
};

function sectionMotion(shouldReduceMotion, delay = 0) {
    return {
        initial: shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
        exit: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 },
        transition: shouldReduceMotion
            ? { duration: 0.01 }
            : { duration: 0.22, delay, ease: "easeOut" },
    };
}

function resolveSections(sections) {
    return { ...MEASUREMENTS_SKELETON_SECTIONS, ...sections };
}

function SkeletonBlock({ className = "", style }) {
    return <div className={`hk-skeleton-shimmer rounded-xl ${className}`} style={style} aria-hidden="true" />;
}

function SectionReveal({ children, delay = 0, className = "", shouldReduceMotion }) {
    return (
        <motion.div className={className} {...sectionMotion(shouldReduceMotion, delay)}>
            {children}
        </motion.div>
    );
}

function SkeletonSurface({ children, className = "" }) {
    return (
        <div
            className={`border shadow-xl ${className}`}
            style={{
                backgroundColor: "color-mix(in srgb, var(--color-card) 92%, transparent)",
                borderColor: "var(--color-border)",
            }}
        >
            {children}
        </div>
    );
}

function HeaderSkeleton() {
    return (
        <header
            className="rounded-[1.5rem] border p-4 shadow-xl"
            style={{
                backgroundColor: "color-mix(in srgb, var(--color-card) 90%, transparent)",
                borderColor: "var(--color-border)",
            }}
        >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                    <SkeletonBlock className="h-12 w-12 rounded-2xl" />
                    <div className="min-w-0">
                        <SkeletonBlock className="h-4 w-36" />
                        <SkeletonBlock className="mt-2 h-3 w-52 max-w-full" />
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <SkeletonBlock className="h-11 w-11 rounded-2xl" />
                    <SkeletonBlock className="h-11 w-11 rounded-2xl" />
                    <SkeletonBlock className="h-12 w-44 rounded-2xl" />
                </div>
            </div>
        </header>
    );
}

function LoadingAnnouncement({ refreshing }) {
    return (
        <p className="sr-only" role="status" aria-live="polite">
            {refreshing ? "Refreshing measurements" : "Loading measurements"}
        </p>
    );
}

function RefreshVeil() {
    return (
        <div
            className="pointer-events-none absolute inset-0 rounded-[2rem]"
            style={{
                backgroundColor: "color-mix(in srgb, var(--color-bg) 18%, transparent)",
            }}
            aria-hidden="true"
        />
    );
}

function MeasurementCardSkeleton({ index }) {
    return (
        <SkeletonSurface className="rounded-[1.5rem] p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
                <SkeletonBlock className="h-[3.25rem] w-[3.25rem] rounded-2xl" />
                <SkeletonBlock className="h-7 w-20 rounded-full" />
            </div>
            <SkeletonBlock className={`mt-5 h-5 ${measurementCardWidths[index]}`} />
            <SkeletonBlock className="mt-3 h-4 w-full" />
            <SkeletonBlock className="mt-2 h-4 w-10/12" />
            <div className="mt-5 flex items-center justify-between border-t pt-4" style={{ borderColor: "var(--color-border)" }}>
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-5 w-5 rounded-full" />
            </div>
        </SkeletonSurface>
    );
}

function AnalyticsPreviewSkeleton() {
    return (
        <SkeletonSurface className="rounded-[1.5rem] p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <SkeletonBlock className="h-4 w-36" />
                    <SkeletonBlock className="mt-2 h-3 w-48" />
                </div>
                <SkeletonBlock className="h-8 w-24 rounded-full" />
            </div>
            <div className="mt-6 flex h-40 items-end gap-3 border-b border-l px-3 pb-3" style={{ borderColor: "var(--color-border)" }}>
                {chartBarHeights.map((height, index) => (
                    <SkeletonBlock key={index} className="w-full rounded-t-xl" style={{ height: `${height}%` }} />
                ))}
            </div>
            <div className="mt-4 grid grid-cols-4 gap-3">
                {analyticsLegendItems.map((index) => (
                    <SkeletonBlock key={index} className="h-3" />
                ))}
            </div>
        </SkeletonSurface>
    );
}

function HistoryPreviewSkeleton() {
    return (
        <SkeletonSurface className="rounded-[1.5rem] p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <SkeletonBlock className="h-4 w-40" />
                    <SkeletonBlock className="mt-2 h-3 w-56 max-w-full" />
                </div>
                <SkeletonBlock className="h-9 w-28 rounded-full" />
            </div>
            <div className="mt-5 space-y-4">
                <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr] gap-3">
                    <SkeletonBlock className="h-3" />
                    <SkeletonBlock className="h-3" />
                    <SkeletonBlock className="h-3" />
                </div>
                {historyRows.map((rowIndex) => (
                    <div key={rowIndex} className="grid grid-cols-[1.2fr_0.8fr_0.8fr] gap-3 border-t pt-4" style={{ borderColor: "var(--color-border)" }}>
                        <SkeletonBlock className="h-4" />
                        <SkeletonBlock className="h-4" />
                        <SkeletonBlock className="h-6 rounded-full" />
                    </div>
                ))}
            </div>
        </SkeletonSurface>
    );
}

export default function MeasurementsSkeleton({ sections = MEASUREMENTS_SKELETON_SECTIONS, refreshing = false }) {
    const shouldReduceMotion = useReducedMotion();
    const visibleSections = resolveSections(sections);

    return (
        <motion.main
            className="hk-page min-h-screen px-4 py-6"
            style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
            {...sectionMotion(shouldReduceMotion, 0)}
        >
            <div
                className="relative mx-auto max-w-7xl"
                aria-busy="true"
                aria-label={refreshing ? "Refreshing measurements" : "Loading measurements"}
            >
                <LoadingAnnouncement refreshing={refreshing} />
                {refreshing ? <RefreshVeil /> : null}

                {visibleSections.header ? (
                    <SectionReveal shouldReduceMotion={shouldReduceMotion}>
                        <HeaderSkeleton />
                    </SectionReveal>
                ) : null}

                <section className="mt-8">
                    {visibleSections.hero ? (
                        <SectionReveal delay={0.04} shouldReduceMotion={shouldReduceMotion}>
                            <SkeletonSurface className="overflow-hidden rounded-[1.75rem]">
                                <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-[1fr_22rem]">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <SkeletonBlock className="h-7 w-32 rounded-full" />
                                            <SkeletonBlock className="h-7 w-24 rounded-full" />
                                        </div>
                                        <SkeletonBlock className="mt-5 h-9 w-[30rem] max-w-full md:h-12" />
                                        <SkeletonBlock className="mt-4 h-4 w-[42rem] max-w-full" />
                                        <SkeletonBlock className="mt-3 h-4 w-[35rem] max-w-full" />
                                    </div>

                                    <div
                                        className="rounded-3xl border p-5"
                                        style={{
                                            backgroundColor: "color-mix(in srgb, var(--color-surface) 86%, transparent)",
                                            borderColor: "var(--color-border)",
                                        }}
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <SkeletonBlock className="h-3 w-36" />
                                                <SkeletonBlock className="mt-3 h-9 w-16" />
                                            </div>
                                            <SkeletonBlock className="h-14 w-14 rounded-2xl" />
                                        </div>
                                        <SkeletonBlock className="mt-5 h-3 w-full rounded-full" />
                                        <div className="mt-4 flex items-center justify-between gap-4">
                                            <SkeletonBlock className="h-4 w-14" />
                                            <SkeletonBlock className="h-4 w-24" />
                                        </div>
                                    </div>
                                </div>
                            </SkeletonSurface>
                        </SectionReveal>
                    ) : null}

                    {visibleSections.cards ? (
                        <SectionReveal delay={0.1} className={refreshing ? "opacity-90" : ""} shouldReduceMotion={shouldReduceMotion}>
                            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {measurementCardIndexes.map((index) => (
                                    <MeasurementCardSkeleton key={index} index={index} />
                                ))}
                            </div>
                        </SectionReveal>
                    ) : null}

                    {visibleSections.analytics || visibleSections.history ? (
                        <SectionReveal delay={0.16} shouldReduceMotion={shouldReduceMotion}>
                            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                                {visibleSections.analytics ? <AnalyticsPreviewSkeleton /> : null}
                                {visibleSections.history ? <HistoryPreviewSkeleton /> : null}
                            </div>
                        </SectionReveal>
                    ) : null}

                    {visibleSections.actions ? (
                        <SectionReveal delay={0.2} shouldReduceMotion={shouldReduceMotion}>
                            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <SkeletonBlock className="h-14 w-full rounded-2xl sm:w-48" />
                                <SkeletonBlock className="h-14 w-full rounded-2xl sm:w-44" />
                            </div>
                        </SectionReveal>
                    ) : null}
                </section>
            </div>
        </motion.main>
    );
}
