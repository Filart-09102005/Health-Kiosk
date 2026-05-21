import { heatmapData } from "../data/demoData";
import { cardClassName, cardStyle } from "../utils/surface";
import AnalyticsChartCard from "./AnalyticsChartCard";

const hourLabels = ["7A", "9A", "11A", "1P", "3P", "5P", "7P"];

export default function HeatmapChart() {
    const max = Math.max(...heatmapData.flatMap((row) => row.hours));

    return (
        <AnalyticsChartCard title="Measurement activity heatmap" description="Daily clinic activity intensity by hour." heightClass="h-[280px]">
            <div className="flex h-full flex-col justify-center gap-2">
                <div className="grid grid-cols-[3rem_repeat(7,minmax(0,1fr))] gap-1 text-[0.6rem] font-black uppercase" style={{ color: "var(--color-muted)" }}>
                    <span />
                    {hourLabels.map((hour) => <span key={hour} className="text-center">{hour}</span>)}
                </div>
                {heatmapData.map((row) => (
                    <div key={row.day} className="grid grid-cols-[3rem_repeat(7,minmax(0,1fr))] gap-1">
                        <span className="flex items-center text-xs font-black">{row.day}</span>
                        {row.hours.map((value, index) => {
                            const intensity = value / max;

                            return (
                                <div
                                    key={`${row.day}-${index}`}
                                    className="aspect-square rounded-md border transition hover:scale-105"
                                    style={{
                                        borderColor: "var(--color-border)",
                                        backgroundColor: `color-mix(in srgb, var(--color-primary) ${Math.round(intensity * 70 + 8)}%, var(--color-surface))`,
                                    }}
                                    title={`${value} measurements`}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>
        </AnalyticsChartCard>
    );
}
