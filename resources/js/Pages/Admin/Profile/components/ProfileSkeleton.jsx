import { SkeletonBlock } from "../../Dashboard/components/DashboardSkeleton.jsx";

export default function ProfileSkeleton() {
    return (
        <div className="mt-6 space-y-6" aria-busy="true" aria-label="Loading profile page">
            <section className="rounded-[18px] border p-6 shadow-xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                        <SkeletonBlock className="h-3 w-40" />
                        <SkeletonBlock className="mt-3 h-9 w-64 max-w-full" />
                        <SkeletonBlock className="mt-3 h-4 w-[38rem] max-w-full" />
                    </div>
                    <SkeletonBlock className="h-11 w-36 rounded-xl" />
                </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[0.85fr_1.35fr]">
                <article className="rounded-[18px] border p-6 shadow-xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                    <div className="flex items-center gap-4">
                        <SkeletonBlock className="h-20 w-20 shrink-0 rounded-2xl" />
                        <div className="min-w-0">
                            <SkeletonBlock className="h-7 w-48" />
                            <SkeletonBlock className="mt-3 h-4 w-40" />
                        </div>
                    </div>

                    <div className="mt-6 space-y-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="flex items-center gap-3 rounded-xl border p-3" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                                <SkeletonBlock className="h-5 w-5 shrink-0 rounded-lg" />
                                <div className="min-w-0 flex-1">
                                    <SkeletonBlock className="h-3 w-24" />
                                    <SkeletonBlock className="mt-2 h-4 w-40 max-w-full" />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 rounded-2xl border p-4" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                        <SkeletonBlock className="h-5 w-40" />
                        <SkeletonBlock className="mt-3 h-4 w-full" />
                        <SkeletonBlock className="mt-2 h-4 w-3/4" />
                    </div>
                </article>

                <article className="rounded-[18px] border p-6 shadow-xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                    <SkeletonBlock className="h-3 w-44" />
                    <SkeletonBlock className="mt-3 h-6 w-56" />

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <SkeletonBlock key={index} className="h-12 w-full rounded-xl" />
                        ))}
                        <div className="md:col-span-2">
                            <SkeletonBlock className="h-12 w-full rounded-xl" />
                        </div>
                    </div>
                </article>
            </section>

            <article className="rounded-[18px] border p-6 shadow-xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                <div className="flex items-start gap-3 border-b pb-5" style={{ borderColor: "var(--color-border)" }}>
                    <SkeletonBlock className="h-11 w-11 shrink-0 rounded-xl" />
                    <div className="min-w-0">
                        <SkeletonBlock className="h-6 w-48" />
                        <SkeletonBlock className="mt-2 h-4 w-[34rem] max-w-full" />
                    </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-3">
                    <SkeletonBlock className="h-12 w-full rounded-xl" />
                    <SkeletonBlock className="h-12 w-full rounded-xl" />
                    <SkeletonBlock className="h-12 w-full rounded-xl" />
                </div>

                <div className="mt-5 flex justify-end">
                    <SkeletonBlock className="h-11 w-40 rounded-xl" />
                </div>
            </article>
        </div>
    );
}
