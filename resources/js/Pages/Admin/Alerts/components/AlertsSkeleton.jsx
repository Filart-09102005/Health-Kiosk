import ShimmerSkeleton from "./ShimmerSkeleton";
import TableSkeleton from "./TableSkeleton";

export default function AlertsSkeleton() {
    return (
        <div className="mt-5 space-y-5">
            <ShimmerSkeleton className="h-28 w-full" />
            <div className="grid gap-4 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                    <ShimmerSkeleton key={index} className="h-32 w-full" />
                ))}
            </div>
            <ShimmerSkeleton className="h-20 w-full" />
            <TableSkeleton />
        </div>
    );
}
