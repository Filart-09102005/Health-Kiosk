export default function ShimmerSkeleton({ className = "h-4 w-full" }) {
    return <div className={`hk-skeleton-shimmer rounded-[1rem] ${className}`} aria-hidden="true" />;
}
