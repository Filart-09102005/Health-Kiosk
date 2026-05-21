import ShimmerSkeleton from "./ShimmerSkeleton";
import { cardClassName, cardStyle } from "../utils/surface";

export default function ChartSkeleton() {
    return (
        <article className={`${cardClassName} p-5`} style={cardStyle}>
            <ShimmerSkeleton className="mb-4 h-4 w-40" />
            <ShimmerSkeleton className="h-[240px] w-full" />
        </article>
    );
}
