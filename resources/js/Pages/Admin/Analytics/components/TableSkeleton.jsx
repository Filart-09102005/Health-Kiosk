import ShimmerSkeleton from "./ShimmerSkeleton";
import { cardClassName, cardStyle } from "../utils/surface";

export default function TableSkeleton({ rows = 5 }) {
    return (
        <article className={`${cardClassName} p-5`} style={cardStyle}>
            <ShimmerSkeleton className="mb-4 h-4 w-48" />
            <div className="space-y-3">
                {Array.from({ length: rows }).map((_, i) => <ShimmerSkeleton key={i} className="h-10 w-full" />)}
            </div>
        </article>
    );
}
