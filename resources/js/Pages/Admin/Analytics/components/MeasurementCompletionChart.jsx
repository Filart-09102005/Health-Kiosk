import { useMemo } from "react";
import { RadialBar, RadialBarChart, ResponsiveContainer, Tooltip } from "recharts";
import { measurementCompletion } from "../data/demoData";
import { chartTooltipStyle, getChartTheme } from "../utils/chartTheme";
import AnalyticsChartCard from "./AnalyticsChartCard";

export default function MeasurementCompletionChart() {
    const theme = useMemo(() => getChartTheme(), []);
    const data = [{ name: "Completed", value: measurementCompletion.completed, fill: theme.success }];

    return (
        <AnalyticsChartCard title="Measurement completion" description="Radial completion rate across required modules.">
            <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="68%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
                    <RadialBar background dataKey="value" cornerRadius={12} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill={theme.text} fontSize="24" fontWeight="900">{measurementCompletion.completed}%</text>
                </RadialBarChart>
            </ResponsiveContainer>
        </AnalyticsChartCard>
    );
}
