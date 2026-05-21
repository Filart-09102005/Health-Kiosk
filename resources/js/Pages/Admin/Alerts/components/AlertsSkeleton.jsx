import ShimmerSkeleton from "./ShimmerSkeleton";
import TableSkeleton from "./TableSkeleton";

export default function AlertsSkeleton() {
    return (
        <div className="space-y-5">
            <ShimmerSkeleton className="h-28 w-full" />
            <div className="grid gap-4 md:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                    <ShimmerSkeleton key={index} className="h-32 w-full" />
                ))}
            </div>
            <ShimmerSkeleton className="h-20 w-full" />
            <TableSkeleton />
        </div>
    );
}
