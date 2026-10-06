import { SkeletonBlock } from "../../Dashboard/components/DashboardSkeleton.jsx";

export default function SettingsSkeleton() {
    return (
        <div className="mt-5 space-y-5" aria-busy="true" aria-label="Loading settings page">
            <section className="rounded-[1.25rem] border p-5 hk-admin-card" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                        <SkeletonBlock className="h-12 w-12 shrink-0 rounded-[1rem]" />
                        <div className="min-w-0">
                            <SkeletonBlock className="h-3 w-40" />
                            <SkeletonBlock className="mt-3 h-9 w-64 max-w-full" />
                            <SkeletonBlock className="mt-3 h-4 w-[36rem] max-w-full" />
                        </div>
                    </div>
                </div>
            </section>

            <SettingsSectionSkeleton panelCount={4} />
            <SettingsSectionSkeleton panelCount={2} />
            <SettingsSectionSkeleton panelCount={2} />

            <section className="flex flex-col gap-4 rounded-[1.25rem] border p-5 lg:flex-row lg:items-center lg:justify-between" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                <div className="min-w-0">
                    <SkeletonBlock className="h-5 w-48" />
                    <SkeletonBlock className="mt-3 h-4 w-[42rem] max-w-full" />
                </div>
                <div className="flex shrink-0 items-center gap-3">
                    <SkeletonBlock className="h-11 w-40 rounded-xl" />
                    <SkeletonBlock className="h-11 w-36 rounded-xl" />
                </div>
            </section>
        </div>
    );
}

function SettingsSectionSkeleton({ panelCount }) {
    return (
        <section className="rounded-[1.25rem] border p-5" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="flex items-start gap-3 border-b pb-5" style={{ borderColor: "var(--color-border)" }}>
                <SkeletonBlock className="h-11 w-11 shrink-0 rounded-xl" />
                <div className="min-w-0">
                    <SkeletonBlock className="h-6 w-56" />
                    <SkeletonBlock className="mt-2 h-4 w-[34rem] max-w-full" />
                </div>
            </div>
            <div className={`mt-5 grid gap-4 ${panelCount === 4 ? "xl:grid-cols-2" : "lg:grid-cols-2"}`}>
                {Array.from({ length: panelCount }).map((_, index) => (
                    <article key={index} className="rounded-[1.25rem] border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                        <div className="flex items-start gap-3">
                            <SkeletonBlock className="h-6 w-6 shrink-0 rounded-lg" />
                            <div className="min-w-0 flex-1">
                                <SkeletonBlock className="h-5 w-48" />
                                <SkeletonBlock className="mt-2 h-4 w-full max-w-sm" />
                            </div>
                        </div>
                        <SkeletonBlock className="mt-5 h-3 w-full rounded-full" />
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <SkeletonBlock className="h-12 w-full rounded-xl" />
                            <SkeletonBlock className="h-12 w-full rounded-xl" />
                            {panelCount === 4 ? (
                                <>
                                    <SkeletonBlock className="h-12 w-full rounded-xl" />
                                    <SkeletonBlock className="h-12 w-full rounded-xl" />
                                </>
                            ) : null}
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
