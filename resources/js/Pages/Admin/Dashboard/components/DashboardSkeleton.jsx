import { motion, useReducedMotion } from "framer-motion";
import { cardClassName, cardStyle } from "../utils/surface";

export const ADMIN_DASHBOARD_SKELETON_MIN_MS = 600;

const statSkeletonItems = [0, 1, 2, 3, 4, 5, 6, 7];
const chartSkeletonItems = [
    { key: "daily", type: "chart", variant: "line" },
    { key: "users", type: "table" },
];

function sectionMotion(shouldReduceMotion, delay = 0) {
    return {
        initial: shouldReduceMotion ? { opacity: 1 } : { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: shouldReduceMotion ? { duration: 0.01 } : { duration: 0.24, delay, ease: "easeOut" },
    };
}

export function SkeletonBlock({ className = "", style }) {
    return <div className={`hk-skeleton-shimmer rounded-xl ${className}`} style={style} aria-hidden="true" />;
}

export default function DashboardSkeleton() {
    const shouldReduceMotion = useReducedMotion();

    return (
        <motion.div
            className="mt-6 space-y-6"
            aria-busy="true"
            aria-label="Loading dashboard"
            {...sectionMotion(shouldReduceMotion)}
        >
            <motion.section className={`${cardClassName} p-6`} style={cardStyle} {...sectionMotion(shouldReduceMotion, 0.04)}>
                <SkeletonBlock className="h-3 w-32" />
                <SkeletonBlock className="mt-3 h-8 w-72 max-w-full" />
                <SkeletonBlock className="mt-3 h-4 w-[42rem] max-w-full" />
                <SkeletonBlock className="mt-2 h-4 w-[34rem] max-w-full" />
                <SkeletonBlock className="mt-4 h-3 w-44" />
            </motion.section>

            <motion.div
                className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                initial="hidden"
                animate="show"
                variants={{
                    hidden: {},
                    show: {
                        transition: shouldReduceMotion ? { staggerChildren: 0 } : { delayChildren: 0.12, staggerChildren: 0.045 },
                    },
                }}
            >
                {statSkeletonItems.map((index) => (
                    <motion.div
                        key={index}
                        variants={{
                            hidden: shouldReduceMotion ? { opacity: 1 } : { opacity: 0 },
                            show: { opacity: 1, transition: shouldReduceMotion ? { duration: 0.01 } : { duration: 0.2, ease: "easeOut" } },
                        }}
                    >
                        <div className={`${cardClassName} p-5`} style={cardStyle}>
                            <div className="flex items-start justify-between gap-3">
                                <SkeletonBlock className="h-7 w-7" />
                                <SkeletonBlock className="h-6 w-16 rounded-full" />
                            </div>
                            <SkeletonBlock className="mt-5 h-8 w-24" />
                            <SkeletonBlock className="mt-3 h-4 w-36" />
                            <SkeletonBlock className="mt-3 h-3 w-40" />
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            <motion.section {...sectionMotion(shouldReduceMotion, 0.2)}>
                <div className="mb-4">
                    <SkeletonBlock className="h-5 w-44" />
                    <SkeletonBlock className="mt-2 h-3 w-80 max-w-full" />
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                    {chartSkeletonItems.map((item) => {
                        if (item.type === "pie") return <PieChartSkeleton key={item.key} items={item.items} />;
                        if (item.type === "table") return <SessionUsersSkeleton key={item.key} />;

                        return <ChartSkeleton key={item.key} variant={item.variant} />;
                    })}
                </div>
            </motion.section>
        </motion.div>
    );
}

function ChartSkeleton({ variant = "line" }) {
    return (
        <article className={`${cardClassName} p-5`} style={cardStyle}>
            <SkeletonBlock className="h-4 w-44" />
            <SkeletonBlock className="mt-2 h-3 w-64 max-w-full" />
            <div className="mt-6 h-[210px]">
                <div className="flex h-full items-end gap-4 border-b border-l px-4 pb-4" style={{ borderColor: "var(--color-border)" }}>
                    {Array.from({ length: 7 }).map((_, index) => (
                        <div key={index} className="flex h-full flex-1 items-end">
                            <SkeletonBlock
                                className={variant === "bar" ? "w-full rounded-t-xl" : "w-full rounded-xl"}
                                style={{ height: "50%" }}
                            />
                        </div>
                    ))}
                </div>
                <div className="mt-3 grid grid-cols-5 gap-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <SkeletonBlock key={index} className="h-3" />
                    ))}
                </div>
            </div>
        </article>
    );
}

function PieChartSkeleton({ items = 3 }) {
    return (
        <article className={`${cardClassName} p-5`} style={cardStyle}>
            <SkeletonBlock className="h-4 w-52" />
            <SkeletonBlock className="mt-2 h-3 w-64 max-w-full" />
            <div className="mt-5 flex h-[220px] items-center gap-5">
                <div className="flex min-w-0 flex-1 items-center justify-center">
                    <div className="relative h-44 w-44 rounded-full hk-skeleton-shimmer">
                        <div className="absolute inset-10 rounded-full" style={{ backgroundColor: "var(--color-card)" }} />
                    </div>
                </div>
                <div className="flex w-28 shrink-0 flex-col gap-4">
                    {Array.from({ length: items }).map((_, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <SkeletonBlock className="h-3 w-3 shrink-0 rounded-full" />
                            <div className="min-w-0 flex-1">
                                <SkeletonBlock className="h-3 w-20" />
                                <SkeletonBlock className="mt-2 h-3 w-10" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </article>
    );
}

function SessionUsersSkeleton() {
    return (
        <article className={`${cardClassName} p-5`} style={cardStyle}>
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="mt-2 h-3 w-64 max-w-full" />
            <div className="mt-5 space-y-4">
                <div className="grid grid-cols-[1fr_1.35fr_0.85fr_0.9fr] gap-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <SkeletonBlock key={index} className="h-3" />
                    ))}
                </div>
                {Array.from({ length: 3 }).map((_, rowIndex) => (
                    <div key={rowIndex} className="grid grid-cols-[1fr_1.35fr_0.85fr_0.9fr] gap-3 border-t pt-4" style={{ borderColor: "var(--color-border)" }}>
                        {Array.from({ length: 4 }).map((_, cellIndex) => (
                            <SkeletonBlock key={cellIndex} className={cellIndex === 3 ? "h-6 rounded-full" : "h-4"} />
                        ))}
                    </div>
                ))}
            </div>
        </article>
    );
}

export function AdminShellSkeleton({ children = <DashboardSkeleton /> }) {
    return (
        <main className="hk-page min-h-screen lg:flex" style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
            <aside className="relative hidden min-h-screen w-80 shrink-0 p-4 lg:block">
                <div className="sticky top-4 flex h-[calc(100vh-2rem)] flex-col rounded-[16px] border p-4 shadow-xl" style={{ backgroundColor: "color-mix(in srgb, var(--color-card) 94%, transparent)", borderColor: "var(--color-border)" }}>
                    <div className="flex h-16 items-center gap-3 border-b pb-4" style={{ borderColor: "var(--color-border)" }}>
                        <SkeletonBlock className="h-11 w-11" />
                        <div className="min-w-0 flex-1">
                            <SkeletonBlock className="h-3 w-28" />
                            <SkeletonBlock className="mt-2 h-4 w-36" />
                            <SkeletonBlock className="mt-2 h-3 w-32" />
                        </div>
                    </div>
                    <div className="mt-6 space-y-5">
                        {[5, 1, 4, 1].map((count, groupIndex) => (
                            <div key={groupIndex} className="space-y-2">
                                {groupIndex !== 1 ? <SkeletonBlock className="mb-3 h-3 w-24" /> : null}
                                {Array.from({ length: count }).map((_, itemIndex) => (
                                    <div key={itemIndex} className="flex h-11 items-center gap-3 rounded-xl px-3">
                                        <SkeletonBlock className="h-5 w-5" />
                                        <SkeletonBlock className="h-4 flex-1" />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className="mt-auto border-t pt-4" style={{ borderColor: "var(--color-border)" }}>
                        <div className="flex h-14 items-center gap-3 rounded-xl border px-3" style={{ borderColor: "var(--color-border)" }}>
                            <SkeletonBlock className="h-9 w-9" />
                            <div className="flex-1">
                                <SkeletonBlock className="h-4 w-28" />
                                <SkeletonBlock className="mt-2 h-3 w-36" />
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            <section className="min-w-0 flex-1 px-4 py-6 lg:px-6">
                <div className="mx-auto max-w-[90rem]">
                    <header className="rounded-2xl border p-4 shadow-xl sm:p-5" style={{ backgroundColor: "color-mix(in srgb, var(--color-card) 90%, transparent)", borderColor: "var(--color-border)" }}>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="min-w-0">
                                <SkeletonBlock className="h-3 w-36" />
                                <SkeletonBlock className="mt-3 h-8 w-72 max-w-full" />
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-3">
                                <SkeletonBlock className="h-11 w-32" />
                                <SkeletonBlock className="h-11 w-11" />
                                <SkeletonBlock className="h-14 w-48" />
                            </div>
                        </div>
                    </header>
                    {children}
                </div>
            </section>
        </main>
    );
}

export function DashboardPageSkeleton() {
    return <AdminShellSkeleton />;
}
