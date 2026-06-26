import { cardClassName, cardStyle } from "../utils/surface";

export default function AnalyticsChartCard({ title, description, children, className = "", heightClass = "h-[240px] sm:h-[260px]", action = null }) {
    return (
        <article className={`${cardClassName} flex h-full flex-col p-5 ${className}`} style={cardStyle}>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-sm font-black">{title}</h3>
                    {description ? <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>{description}</p> : null}
                </div>
                {action ? <div className="shrink-0">{action}</div> : null}
            </div>
            <div className={`w-full ${heightClass}`}>{children}</div>
        </article>
    );
}
