import ShimmerSkeleton from "./ShimmerSkeleton";
import { cardClassName, cardStyle } from "../utils/surface";

export default function TableSkeleton() {
    return (
        <article className={`${cardClassName} p-5`} style={cardStyle} aria-busy="true" aria-label="Loading records table">
            <ShimmerSkeleton className="mb-4 h-10 w-full max-w-md" />
            <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, index) => (
                    <ShimmerSkeleton key={index} className="h-12 w-full" />
                ))}
            </div>
        </article>
    );
}
