import ShimmerSkeleton from "./ShimmerSkeleton";

export default function DrawerSkeleton() {
    return (
        <div className="space-y-4">
            <ShimmerSkeleton className="h-20 w-full" />
            <div className="grid grid-cols-2 gap-3">
                <ShimmerSkeleton className="h-24 w-full" />
                <ShimmerSkeleton className="h-24 w-full" />
            </div>
            <ShimmerSkeleton className="h-40 w-full" />
            <ShimmerSkeleton className="h-56 w-full" />
        </div>
    );
}
