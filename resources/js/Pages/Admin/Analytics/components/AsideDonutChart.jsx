import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { chartTooltipStyle } from "../utils/chartTheme";

function AsideChartTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;

    const item = payload[0].payload;

    return (
        <div className="rounded-[1rem] border px-3 py-2 shadow-xl" style={{ ...chartTooltipStyle }}>
            <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-[4px]" style={{ backgroundColor: item.color }} />
                <p className="text-xs font-black">{item.label}</p>
            </div>
            <p className="mt-1 text-xs font-bold" style={{ color: "var(--color-muted)" }}>{item.detail}</p>
            <p className="mt-1 text-sm font-black">{item.value} cases</p>
        </div>
    );
}

export default function AsideDonutChart({
    data,
    totalLabel,
    valueSuffix = "",
    emptyMessage = "No matching risk data for the selected filters.",
    chartVariant = "half",
}) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const percent = (value) => total ? Math.round((value / total) * 100) : 0;
    const isFull = chartVariant === "full";
    const startAngle = isFull ? 90 : 180;
    const endAngle = isFull ? 450 : 0;
    const chartCy = isFull ? "50%" : "68%";
    const innerRadius = isFull ? "44%" : "50%";
    const outerRadius = isFull ? "72%" : "88%";

    if (!total) {
        return (
            <p className="text-center text-xs font-bold" style={{ color: "var(--color-muted)" }}>
                {emptyMessage}
            </p>
        );
    }

    return (
        <div className="flex h-full min-h-[140px] w-full items-stretch gap-3">
            <div className="relative h-full min-h-[140px] w-1/2 shrink-0">
                <ResponsiveContainer debounce={50} width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={[{ key: "track", value: total }]}
                            dataKey="value"
                            cx="50%"
                            cy={chartCy}
                            innerRadius={innerRadius}
                            outerRadius={outerRadius}
                            startAngle={startAngle}
                            endAngle={endAngle}
                            stroke="none"
                            fill="color-mix(in srgb, var(--color-muted) 18%, transparent)"
                            isAnimationActive={false}
                        />
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="label"
                            cx="50%"
                            cy={chartCy}
                            innerRadius={innerRadius}
                            outerRadius={outerRadius}
                            paddingAngle={isFull ? 3 : 4}
                            cornerRadius={isFull ? 6 : 9}
                            stroke="var(--color-card)"
                            strokeWidth={3}
                            startAngle={startAngle}
                            endAngle={endAngle}
                            isAnimationActive={false}
                        >
                            {data.map((entry) => (
                                <Cell key={entry.key} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip content={<AsideChartTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
                <div
                    className={`pointer-events-none absolute flex flex-col items-center ${isFull ? "inset-0 justify-center" : "inset-x-0 bottom-[8%] justify-end"}`}
                >
                    <span className={`font-black leading-none ${isFull ? "text-2xl sm:text-3xl" : "text-2xl sm:text-3xl"}`}>{total}</span>
                    <span
                        className={`mt-1 max-w-[4.8rem] text-center font-black uppercase leading-tight ${isFull ? "text-[0.5rem] tracking-[0.04em] sm:text-[0.55rem]" : "text-[0.62rem] tracking-[0.12em] sm:text-[0.68rem]"}`}
                        style={{ color: "var(--color-muted)" }}
                    >
                        {totalLabel}
                    </span>
                </div>
            </div>

            <div className="flex w-1/2 min-w-0 flex-col justify-center space-y-2">
                {data.map((item) => (
                    <div key={item.key} className="grid grid-cols-[minmax(0,1fr)_3.25rem] items-start gap-2">
                        <div className="min-w-0">
                            <p className="flex min-w-0 items-center gap-2 text-xs font-black">
                                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="truncate">{item.label}</span>
                            </p>
                            <p className="ml-4 truncate text-[0.68rem] font-bold" style={{ color: "var(--color-muted)" }}>{item.detail}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-black">{percent(item.value)}%</p>
                            <p className="text-[0.65rem] font-bold" style={{ color: "var(--color-muted)" }}>
                                {item.value}{valueSuffix}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
