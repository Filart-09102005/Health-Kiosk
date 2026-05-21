import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import AnalyticsFilters from "./components/AnalyticsFilters";
import AnalyticsHeader from "./components/AnalyticsHeader";
import AnalyticsInsightsPanel from "./components/AnalyticsInsightsPanel";
import AnalyticsOverviewGrid from "./components/AnalyticsOverviewGrid";
import AnalyticsSkeleton from "./components/AnalyticsSkeleton";
import BMIDistributionChart from "./components/BMIDistributionChart";
import DeviceMeasurementPanel from "./components/DeviceMeasurementPanel";
import HealthMetricsTable from "./components/HealthMetricsTable";
import HealthStatusDistributionChart from "./components/HealthStatusDistributionChart";
import HeartRateTrendChart from "./components/HeartRateTrendChart";
import HeatmapChart from "./components/HeatmapChart";
import MeasurementAccuracyChart from "./components/MeasurementAccuracyChart";
import MeasurementCompletionChart from "./components/MeasurementCompletionChart";
import MeasurementPerformancePanel from "./components/MeasurementPerformancePanel";
import MonthlyAnalyticsChart from "./components/MonthlyAnalyticsChart";
import MostCommonAlertsChart from "./components/MostCommonAlertsChart";
import PeakUsageHoursChart from "./components/PeakUsageHoursChart";
import RecentAnalyticsTable from "./components/RecentAnalyticsTable";
import SectionHeader from "./components/SectionHeader";
import SessionAnalyticsChart from "./components/SessionAnalyticsChart";
import SpO2TrendChart from "./components/SpO2TrendChart";
import TemperatureTrendChart from "./components/TemperatureTrendChart";
import TopAlertsTable from "./components/TopAlertsTable";
import WeeklyAnalyticsChart from "./components/WeeklyAnalyticsChart";

const defaultFilters = {
    dateFrom: "2026-05-01",
    dateTo: "2026-05-19",
    period: "weekly",
    role: "all",
    healthStatus: "all",
    measurement: "all",
    comparison: "today",
};

export default function Analytics() {
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [filters, setFilters] = useState(defaultFilters);

    useEffect(() => {
        const timer = window.setTimeout(() => setLoading(false), 600);

        return () => window.clearTimeout(timer);
    }, []);

    useEffect(() => {
        setIsSearching(true);
        const timer = window.setTimeout(() => setIsSearching(false), 380);

        return () => window.clearTimeout(timer);
    }, [search]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.role !== "all") count += 1;
        if (filters.healthStatus !== "all") count += 1;
        if (filters.measurement !== "all") count += 1;
        if (filters.comparison !== "today") count += 1;

        return count;
    }, [filters]);

    const handleFilterChange = useCallback((key, value) => {
        setFilters((current) => ({ ...current, [key]: value }));
    }, []);

    const handleRefresh = useCallback(() => {
        setLoading(true);
        window.setTimeout(() => setLoading(false), 500);
    }, []);

    if (loading) {
        return <AnalyticsSkeleton />;
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.28 }} className="mt-6 space-y-6">
            <AnalyticsHeader />
            <AnalyticsOverviewGrid />
            <AnalyticsFilters
                filters={filters}
                onChange={handleFilterChange}
                search={search}
                onSearchChange={setSearch}
                isSearching={isSearching}
                onRefresh={handleRefresh}
                activeFilterCount={activeFilterCount}
            />

            <section>
                <SectionHeader title="Clinical trend charts" description="Vitals, BMI, and health status visualization from demo telemetry." />
                <div className="grid gap-4 xl:grid-cols-2">
                    <TemperatureTrendChart />
                    <HeartRateTrendChart />
                    <SpO2TrendChart />
                    <BMIDistributionChart />
                    <HealthStatusDistributionChart />
                    <MeasurementCompletionChart />
                    <WeeklyAnalyticsChart />
                    <MonthlyAnalyticsChart />
                    <SessionAnalyticsChart />
                    <PeakUsageHoursChart />
                    <MostCommonAlertsChart />
                    <HeatmapChart />
                    <MeasurementAccuracyChart />
                </div>
            </section>

            <AnalyticsInsightsPanel />
            <MeasurementPerformancePanel />
            <DeviceMeasurementPanel />

            <section>
                <SectionHeader title="Analytics tables" description="Metric summaries, alert frequency, and recent analytics events." />
                <div className="grid gap-4 xl:grid-cols-2">
                    <HealthMetricsTable />
                    <TopAlertsTable />
                    <div className="xl:col-span-2">
                        <RecentAnalyticsTable />
                    </div>
                </div>
            </section>
        </motion.div>
    );
}
