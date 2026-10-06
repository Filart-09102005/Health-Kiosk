import { motion, useReducedMotion } from "framer-motion";

export const NOTIFICATIONS_SKELETON_MIN_MS = 500;

const rowWidths = [
    { title: "w-40", message: "w-9/12" },
    { title: "w-32", message: "w-7/12" },
    { title: "w-44", message: "w-10/12" },
    { title: "w-36", message: "w-6/12" },
    { title: "w-40", message: "w-8/12" },
    { title: "w-28", message: "w-7/12" },
];

function SkeletonBlock({ className = "", style }) {
    return <div className={`hk-skeleton-shimmer rounded-xl ${className}`} style={style} aria-hidden="true" />;
}

export function NotificationRowSkeleton({ index }) {
    const widths = rowWidths[index % rowWidths.length];

    return (
        <div
            className="flex w-full items-center gap-3 rounded-xl border px-4 py-2.5"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
            <SkeletonBlock className="h-2 w-2 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                    <SkeletonBlock className={`h-3.5 ${widths.title}`} />
                    <SkeletonBlock className="h-2.5 w-28 shrink-0" />
                </div>
                <SkeletonBlock className={`mt-1.5 h-2.5 ${widths.message}`} />
            </div>
            <SkeletonBlock className="h-3 w-3 shrink-0" />
        </div>
    );
}

export default function NotificationsSkeleton() {
    const shouldReduceMotion = useReducedMotion();

    return (
        <motion.main
            className="flex h-[100dvh] flex-col overflow-hidden px-4 py-6"
            style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 0.24, ease: "easeOut" }}
        >
            <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col" aria-busy="true" aria-label="Loading notifications">
                <p className="sr-only" role="status" aria-live="polite">Loading notifications</p>

                <section
                    className="flex shrink-0 items-center justify-between gap-3 rounded-[2rem] border p-6 shadow-2xl md:p-8"
                    style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                >
                    <div className="flex items-center gap-3">
                        <SkeletonBlock className="h-10 w-10 rounded-2xl" />
                        <div>
                            <SkeletonBlock className="h-7 w-40" />
                            <SkeletonBlock className="mt-1.5 h-3 w-28" />
                        </div>
                    </div>
                    <SkeletonBlock className="h-10 w-32 rounded-xl" />
                </section>

                <section
                    className="mt-5 flex min-h-0 flex-1 flex-col rounded-[2rem] border p-6 shadow-2xl md:p-8"
                    style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                >
                    <div className="hk-slim-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
                        {rowWidths.map((_, index) => (
                            <NotificationRowSkeleton key={index} index={index} />
                        ))}
                    </div>
                </section>
            </div>
        </motion.main>
    );
}
