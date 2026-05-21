import ChartSkeleton from "./ChartSkeleton";
import ShimmerSkeleton from "./ShimmerSkeleton";
import { cardClassName, cardStyle } from "../utils/surface";

export default function AnalyticsSkeleton() {
    return (
        <div className="mt-6 space-y-6" aria-busy="true">
            <ShimmerSkeleton className="h-32 w-full" />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className={`${cardClassName} p-4`} style={cardStyle}>
                        <ShimmerSkeleton className="h-8 w-8" />
                        <ShimmerSkeleton className="mt-4 h-6 w-20" />
                    </div>
                ))}
            </div>
            <ShimmerSkeleton className="h-24 w-full" />
            <div className="grid gap-4 xl:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => <ChartSkeleton key={i} />)}
            </div>
        </div>
    );
}
