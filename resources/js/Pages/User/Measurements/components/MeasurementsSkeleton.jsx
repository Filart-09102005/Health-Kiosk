import { motion, useReducedMotion } from "framer-motion";

const measurementCardWidths = ["w-36", "w-28", "w-24", "w-24"];
const measurementCardIndexes = [0, 1, 2, 3];
const progressPillWidths = ["w-28", "w-20", "w-16", "w-16"];

export const MEASUREMENTS_SKELETON_MIN_MS = 600;

export const MEASUREMENTS_SKELETON_SECTIONS = {
    header: true,
    progress: true,
    modeToggle: true,
    hero: true,
    cards: true,
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

// Mirrors the exact DOM/class structure of ../../components/Header.jsx so the
// skeleton never jumps once real content swaps in.
function HeaderSkeleton() {
    return (
        <div
            className="rounded-[1.5rem] border px-2.5 py-2.5 shadow-2xl sm:rounded-[2rem] sm:px-4 sm:py-4 md:px-5"
            style={{
                backgroundColor: "color-mix(in srgb, var(--color-card) 90%, transparent)",
                borderColor: "var(--color-border)",
            }}
        >
            <div className="flex flex-row flex-nowrap items-center justify-between gap-2 sm:gap-4">
                <div className="flex min-w-0 items-center gap-2 sm:gap-4">
                    <SkeletonBlock className="h-9 w-9 shrink-0 rounded-xl sm:h-12 sm:w-12 sm:rounded-2xl md:h-14 md:w-14" />
                    <div className="min-w-0">
                        <SkeletonBlock className="hidden h-3 w-24 sm:block" />
                        <SkeletonBlock className="mt-1 h-4 w-32 sm:mt-2 sm:h-6 sm:w-64 max-w-full" />
                    </div>
                </div>
                <div className="flex flex-nowrap shrink-0 items-center justify-end gap-1.5 sm:gap-3">
                    <SkeletonBlock className="h-7 w-12 rounded-xl sm:h-11 sm:w-20 sm:rounded-2xl" />
                    <SkeletonBlock className="h-9 w-9 rounded-xl sm:h-11 sm:w-28 sm:rounded-2xl" />
                    <SkeletonBlock className="h-9 w-9 rounded-xl sm:h-11 sm:w-36 sm:rounded-2xl" />
                    <SkeletonBlock className="h-9 w-9 rounded-xl sm:h-11 sm:w-11 sm:rounded-2xl" />
                    <SkeletonBlock className="h-9 w-9 rounded-lg sm:h-11 sm:w-40 sm:rounded-2xl" />
                </div>
            </div>
        </div>
    );
}

// Mirrors the "Progress" pill row rendered between Header and the picker
// section in Measurements.jsx.
function ProgressRowSkeleton() {
    return (
        <div className="flex items-center justify-center gap-3">
            <SkeletonBlock className="h-3 w-16" />
            <div className="flex gap-2">
                {progressPillWidths.map((width, index) => (
                    <SkeletonBlock key={index} className={`h-6 ${width} rounded-full`} />
                ))}
            </div>
        </div>
    );
}

// Mirrors MeasurementModeToggle.jsx.
function ModeToggleSkeleton() {
    return (
        <div
            className="flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border p-4 sm:p-5"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
            <div className="min-w-0">
                <SkeletonBlock className="h-3 w-32" />
                <SkeletonBlock className="mt-2 h-4 w-48 max-w-full" />
            </div>
            <div
                className="flex shrink-0 gap-1 rounded-2xl border p-1"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
            >
                <SkeletonBlock className="h-10 w-28 rounded-xl sm:w-32" />
                <SkeletonBlock className="h-10 w-28 rounded-xl sm:w-32" />
            </div>
        </div>
    );
}

function MeasurementCardSkeleton({ index }) {
    return (
        <SkeletonSurface className="rounded-[1.5rem] p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <SkeletonBlock className="h-14 w-14 rounded-2xl" />
                <SkeletonBlock className="mt-0.5 h-6 w-20 rounded-lg" />
            </div>
            <SkeletonBlock className={`mt-4 h-4 ${measurementCardWidths[index]}`} />
            <SkeletonBlock className="mt-2.5 h-3.5 w-full" />
            <SkeletonBlock className="mt-2 h-3.5 w-10/12" />
            <div className="mt-4 flex items-center justify-between border-t pt-4" style={{ borderColor: "var(--color-border)" }}>
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-4 w-4 rounded-full" />
            </div>
        </SkeletonSurface>
    );
}

export default function MeasurementsSkeleton({ sections = MEASUREMENTS_SKELETON_SECTIONS, refreshing = false }) {
    const shouldReduceMotion = useReducedMotion();
    const visibleSections = resolveSections(sections);

    return (
        <motion.main
            className="hk-page min-h-screen"
            style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
            {...sectionMotion(shouldReduceMotion, 0)}
        >
            <div
                className="relative mx-auto max-w-7xl px-4 py-6"
                aria-busy="true"
                aria-label={refreshing ? "Refreshing measurements" : "Loading measurements"}
            >
                <p className="sr-only" role="status" aria-live="polite">
                    {refreshing ? "Refreshing measurements" : "Loading measurements"}
                </p>

                {visibleSections.header ? (
                    <SectionReveal shouldReduceMotion={shouldReduceMotion}>
                        <HeaderSkeleton />
                    </SectionReveal>
                ) : null}

                {visibleSections.progress ? (
                    <SectionReveal delay={0.02} className="mt-8" shouldReduceMotion={shouldReduceMotion}>
                        <ProgressRowSkeleton />
                    </SectionReveal>
                ) : null}

                <section className="mt-8">
                    {visibleSections.modeToggle ? (
                        <SectionReveal delay={0.05} className="mb-5" shouldReduceMotion={shouldReduceMotion}>
                            <ModeToggleSkeleton />
                        </SectionReveal>
                    ) : null}

                    {visibleSections.hero ? (
                        <SectionReveal delay={0.09} shouldReduceMotion={shouldReduceMotion}>
                            <SkeletonSurface className="overflow-hidden rounded-[2rem]">
                                <SkeletonBlock className="h-1 w-2/3 rounded-none" />
                                <div className="grid lg:grid-cols-[1fr_20rem]">
                                    <div className="p-7 md:p-10">
                                        <SkeletonBlock className="h-6 w-32 rounded-full" />
                                        <SkeletonBlock className="mt-5 h-10 w-64 max-w-full md:h-12" />
                                        <SkeletonBlock className="mt-3 h-4 w-full max-w-lg" />
                                        <SkeletonBlock className="mt-2 h-4 w-10/12 max-w-lg" />
                                    </div>
                                    <div
                                        className="border-l p-7"
                                        style={{
                                            borderColor: "var(--color-border)",
                                            backgroundColor: "var(--color-surface)",
                                        }}
                                    >
                                        <SkeletonBlock className="h-3 w-40" />
                                        <SkeletonBlock className="mt-3 h-4 w-full" />
                                        <SkeletonBlock className="mt-2 h-4 w-9/12" />
                                    </div>
                                </div>
                            </SkeletonSurface>
                        </SectionReveal>
                    ) : null}

                    {visibleSections.cards ? (
                        <SectionReveal delay={0.14} className={refreshing ? "opacity-90" : ""} shouldReduceMotion={shouldReduceMotion}>
                            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                {measurementCardIndexes.map((index) => (
                                    <MeasurementCardSkeleton key={index} index={index} />
                                ))}
                            </div>
                        </SectionReveal>
                    ) : null}

                    {visibleSections.actions ? (
                        <SectionReveal delay={0.2} shouldReduceMotion={shouldReduceMotion}>
                            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <SkeletonBlock className="h-14 w-full rounded-2xl sm:w-48" />
                            </div>
                        </SectionReveal>
                    ) : null}
                </section>
            </div>
        </motion.main>
    );
}
