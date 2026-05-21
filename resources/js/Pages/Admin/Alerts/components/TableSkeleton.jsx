import ShimmerSkeleton from "./ShimmerSkeleton";

export default function TableSkeleton() {
    return (
        <div className="space-y-3">
            <ShimmerSkeleton className="h-10 w-full" />
            {Array.from({ length: 6 }).map((_, index) => (
                <ShimmerSkeleton key={index} className="h-14 w-full" />
            ))}
        </div>
    );
}
