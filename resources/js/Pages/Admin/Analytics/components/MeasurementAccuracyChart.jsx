import { useMemo } from "react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import { measurementAccuracy } from "../data/demoData";
import { chartTooltipStyle, getChartTheme } from "../utils/chartTheme";
import AnalyticsChartCard from "./AnalyticsChartCard";

export default function MeasurementAccuracyChart() {
    const theme = useMemo(() => getChartTheme(), []);

    return (
        <AnalyticsChartCard title="Measurement accuracy" description="Sensor consistency across kiosk modules.">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={measurementAccuracy} cx="50%" cy="50%" outerRadius="78%">
                    <PolarGrid stroke={theme.border} />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: theme.muted, fontSize: 10, fontWeight: 700 }} />
                    <Radar dataKey="value" stroke={theme.primary} fill={theme.primary} fillOpacity={0.25} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                </RadarChart>
            </ResponsiveContainer>
        </AnalyticsChartCard>
    );
}
