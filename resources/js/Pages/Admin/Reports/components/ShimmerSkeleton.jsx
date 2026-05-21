export default function ShimmerSkeleton({ className = "h-4 w-full" }) {
    return <div className={`hk-skeleton-shimmer rounded-[12px] ${className}`} aria-hidden="true" />;
}
