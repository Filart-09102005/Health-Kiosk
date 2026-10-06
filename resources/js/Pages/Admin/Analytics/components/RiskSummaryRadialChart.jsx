import { useCallback, useRef, useState } from "react";
import { chartTooltipStyle } from "../utils/chartTheme";

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180;

    return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
    };
}

function describeClockwiseArc(centerX, centerY, radius, startAngle, endAngle) {
    const start = polarToCartesian(centerX, centerY, radius, startAngle);
    const end = polarToCartesian(centerX, centerY, radius, endAngle);
    const largeArcFlag = Math.abs(endAngle - startAngle) <= 180 ? "0" : "1";

    return [
        "M", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 1, end.x, end.y,
    ].join(" ");
}

export default function RiskSummaryRadialChart({
    data = [],
    totalLabel = "cases",
    eyebrow = "Clinic Risk Overview",
    title = "Risk Summary",
    description = "Distribution of health cases that may need clinic follow-up in the selected cohort.",
    emptyMessage = "No matching risk data for the selected filters.",
    className = "",
}) {
    const [activeRisk, setActiveRisk] = useState(null);
    const [tooltipPoint, setTooltipPoint] = useState({ x: 0, y: 0 });
    const chartRef = useRef(null);
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const percent = (value) => total ? Math.round((value / total) * 100) : 0;
    const maxValue = Math.max(...data.map((item) => item.value), 1);
    const chartSize = 540;
    const center = chartSize / 2;
    const ringWidth = 12;
    const ringGap = 15;
    const maxRadius = 232;
    const arcStartAngle = 0;
    const trackEndY = center;

    const updateTooltipPosition = useCallback((event) => {
        if (!chartRef.current) {
            return;
        }

        const rect = chartRef.current.getBoundingClientRect();
        setTooltipPoint({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        });
    }, []);

    const showRiskTooltip = useCallback((item, event) => {
        setActiveRisk(item);
        updateTooltipPosition(event);
    }, [updateTooltipPosition]);

    const hideRiskTooltip = useCallback(() => {
        setActiveRisk(null);
    }, []);

    return (
        <div
            className={`relative flex flex-col overflow-visible rounded-[26px] border px-6 py-6 sm:px-10 ${className}`.trim()}
            style={{ borderColor: "var(--color-border)", backgroundColor: "color-mix(in srgb, var(--color-card) 86%, transparent)" }}
        >
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-primary)" }}>{eyebrow}</p>
                    <h2 className="mt-2 text-3xl font-black">{title}</h2>
                </div>
                {description ? (
                    <p className="max-w-md text-xs font-bold leading-5 sm:text-right" style={{ color: "var(--color-muted)" }}>
                        {description}
                    </p>
                ) : null}
            </div>

            {!total ? (
                <div className="mt-7 rounded-[1.25rem] border p-4 text-center text-xs font-bold" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-muted)" }}>
                    {emptyMessage}
                </div>
            ) : (
                <div
                    className="relative mt-7 flex min-h-[320px] flex-1 items-center justify-center overflow-visible"
                    onMouseLeave={hideRiskTooltip}
                >
                    <div
                        ref={chartRef}
                        className="relative aspect-square w-full max-w-[540px]"
                        onMouseMove={(event) => {
                            if (activeRisk) {
                                updateTooltipPosition(event);
                            }
                        }}
                    >
                        {data.map((item, index) => {
                            const radius = maxRadius - index * (ringWidth + ringGap);
                            const topPercent = ((center - radius) / chartSize) * 100;
                            const anchorLeftPercent = (center / chartSize) * 100;

                            return (
                                <button
                                    key={item.key}
                                    type="button"
                                    onMouseEnter={(event) => showRiskTooltip(item, event)}
                                    onMouseMove={(event) => showRiskTooltip(item, event)}
                                    onFocus={(event) => showRiskTooltip(item, event)}
                                    onBlur={hideRiskTooltip}
                                    className="absolute z-10 max-w-[11rem] truncate rounded-[8px] text-right text-xs font-bold transition sm:max-w-[14rem]"
                                    style={{
                                        top: `${topPercent}%`,
                                        left: `${anchorLeftPercent}%`,
                                        transform: "translate(calc(-100% - 10px), -50%)",
                                        color: activeRisk?.key === item.key ? "var(--color-text)" : "var(--color-muted)",
                                    }}
                                >
                                    {item.label.replace(" Cases", "")} {percent(item.value)}%
                                </button>
                            );
                        })}

                        <svg viewBox={`0 0 ${chartSize} ${chartSize}`} className="h-full w-full overflow-visible" role="img" aria-label="Risk summary radial chart">
                            {data.map((item, index) => {
                                const radius = maxRadius - index * (ringWidth + ringGap);
                                const endCos = Math.max(-0.92, Math.min(0.92, (center - trackEndY) / radius));
                                const trackEndAngle = 360 - (Math.acos(endCos) * 180) / Math.PI;
                                const fillRatio = Math.min(0.76, 0.16 + 0.58 * (item.value / maxValue));
                                const colorEndAngle = arcStartAngle + (trackEndAngle - arcStartAngle) * fillRatio;

                                return (
                                    <g key={item.key}>
                                        <path
                                            d={describeClockwiseArc(center, center, radius, arcStartAngle, trackEndAngle)}
                                            fill="none"
                                            stroke="color-mix(in srgb, var(--color-muted) 12%, transparent)"
                                            strokeWidth={ringWidth}
                                            strokeLinecap="round"
                                        />
                                        <path
                                            d={describeClockwiseArc(center, center, radius, arcStartAngle, colorEndAngle)}
                                            fill="none"
                                            stroke={item.color}
                                            strokeWidth={ringWidth}
                                            strokeLinecap="round"
                                            onMouseEnter={(event) => showRiskTooltip(item, event)}
                                            onMouseMove={(event) => showRiskTooltip(item, event)}
                                            onMouseLeave={hideRiskTooltip}
                                            style={{ cursor: "pointer", opacity: activeRisk && activeRisk.key !== item.key ? 0.42 : 1 }}
                                        />
                                    </g>
                                );
                            })}
                        </svg>

                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-black leading-none">{total}</span>
                            <span className="mt-1 text-[0.68rem] font-black uppercase tracking-[0.16em]" style={{ color: "var(--color-muted)" }}>
                                {totalLabel}
                            </span>
                        </div>

                        {activeRisk ? (
                            <div
                                className="pointer-events-none absolute left-0 top-0 z-20 min-w-[190px] rounded-[1.25rem] border px-3 py-2 shadow-xl"
                                style={{
                                    ...chartTooltipStyle,
                                    transform: `translate(${tooltipPoint.x + 14}px, ${tooltipPoint.y + 14}px)`,
                                    transition: "transform 140ms ease-out",
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: activeRisk.color }} />
                                    <p className="text-xs font-black">{activeRisk.label}</p>
                                </div>
                                <p className="mt-1 text-xs font-bold" style={{ color: "var(--color-muted)" }}>{activeRisk.detail}</p>
                                <p className="mt-1 text-sm font-black">{activeRisk.value} {totalLabel} · {percent(activeRisk.value)}%</p>
                            </div>
                        ) : null}
                    </div>

                    <div className="absolute bottom-7 left-7 right-7 grid gap-2 sm:grid-cols-2 lg:hidden">
                        {data.map((item) => (
                            <div key={item.key} className="flex items-center gap-2 text-xs font-bold">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="truncate">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
