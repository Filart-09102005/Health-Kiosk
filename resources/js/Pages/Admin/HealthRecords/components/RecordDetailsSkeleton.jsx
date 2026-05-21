import ShimmerSkeleton from "./ShimmerSkeleton";

export default function RecordDetailsSkeleton() {
    return (
        <div className="space-y-5 p-5" aria-busy="true">
            <ShimmerSkeleton className="h-8 w-48" />
            <ShimmerSkeleton className="h-4 w-64" />
            <div className="grid gap-3 sm:grid-cols-2">
                <ShimmerSkeleton className="h-28 w-full" />
                <ShimmerSkeleton className="h-28 w-full" />
            </div>
            <ShimmerSkeleton className="h-40 w-full" />
            <ShimmerSkeleton className="h-56 w-full" />
        </div>
    );
}
