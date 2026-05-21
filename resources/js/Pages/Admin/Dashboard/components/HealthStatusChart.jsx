import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { chartTooltipStyle, getChartTheme } from "../utils/chartTheme";
import ChartCard from "./ChartCard";

export default function HealthStatusChart() {
    const theme = useMemo(() => getChartTheme(), []);
    const data = useMemo(
        () => [
            { name: "Normal", value: 68, color: theme.success },
            { name: "Watch", value: 22, color: theme.primary },
            { name: "Alert", value: 10, color: theme.error },
        ],
        [theme],
    );
    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <ChartCard title="Health Status Distribution" description="Clinical classification of recent screenings.">
            <div className="flex h-full items-center gap-5">
                <div className="h-full min-w-0 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                            <Pie
                                data={data}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={68}
                                outerRadius={104}
                                paddingAngle={4}
                            >
                                {data.map((entry) => (
                                    <Cell key={entry.name} fill={entry.color} stroke="var(--color-card)" strokeWidth={3} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={chartTooltipStyle} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="flex w-28 shrink-0 flex-col gap-3">
                    {data.map((item) => (
                        <div key={item.name} className="flex items-center gap-3">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                            <div className="min-w-0">
                                <p className="text-xs font-black leading-none">{item.name}</p>
                                <p className="mt-1 text-[0.68rem] font-bold" style={{ color: "var(--color-muted)" }}>
                                    {Math.round((item.value / total) * 100)}%
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </ChartCard>
    );
}
