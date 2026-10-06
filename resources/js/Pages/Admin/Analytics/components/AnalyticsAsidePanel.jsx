export default function AnalyticsAsidePanel({
    eyebrow,
    title,
    titleClassName = "mt-2 text-lg font-black",
    description,
    descriptionClassName = "mt-2 text-xs font-bold leading-5",
    footer,
    children,
    emptyMessage,
    isEmpty = false,
    fillHeight = false,
    className = "",
}) {
    const hasHeader = Boolean(eyebrow || title || description);

    return (
        <div
            className={`overflow-hidden rounded-[16px] border p-3 ${fillHeight ? "flex h-full min-h-0 flex-col" : ""} ${className}`.trim()}
            style={{
                borderColor: "var(--color-border)",
                backgroundColor: "color-mix(in srgb, var(--color-surface) 82%, var(--color-card))",
            }}
        >
            {hasHeader ? (
                <div className="shrink-0">
                    {eyebrow ? (
                        <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-primary)" }}>
                            {eyebrow}
                        </p>
                    ) : null}
                    {title ? <h2 className={titleClassName}>{title}</h2> : null}
                    {description ? (
                        <p className={descriptionClassName} style={{ color: "var(--color-muted)" }}>
                            {description}
                        </p>
                    ) : null}
                </div>
            ) : null}

            {isEmpty && emptyMessage ? (
                <p
                    className={`rounded-[1.25rem] border p-3 text-xs font-bold ${hasHeader ? "mt-3" : ""} ${fillHeight ? "flex flex-1 items-center justify-center" : ""}`.trim()}
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-muted)" }}
                >
                    {emptyMessage}
                </p>
            ) : children ? (
                <div className={`${hasHeader ? "mt-3" : ""} ${fillHeight ? "flex min-h-0 flex-1 flex-col justify-center" : ""}`.trim()}>
                    {children}
                </div>
            ) : null}

            {footer ? <div className="mt-3 shrink-0">{footer}</div> : null}
        </div>
    );
}
