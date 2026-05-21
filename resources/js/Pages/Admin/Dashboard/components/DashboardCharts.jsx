import BMIDistributionChart from "./BMIDistributionChart";
import DailyHealthChecksChart from "./DailyHealthChecksChart";
import HealthStatusChart from "./HealthStatusChart";
import HeartRateAnalyticsChart from "./HeartRateAnalyticsChart";
import SectionHeader from "./SectionHeader";
import SessionCompletionChart from "./SessionCompletionChart";
import SessionUsersTable from "./SessionUsersTable";
import SpO2AnalyticsChart from "./SpO2AnalyticsChart";
import TemperatureAnalyticsChart from "./TemperatureAnalyticsChart";

export default function DashboardCharts() {
    return (
        <section>
            <SectionHeader
                title="Clinical analytics"
                description="Vitals, BMI, and session insights from kiosk demo telemetry."
            />
            <div className="grid gap-4 xl:grid-cols-2">
                <DailyHealthChecksChart />
                <HealthStatusChart />
                <BMIDistributionChart />
                <TemperatureAnalyticsChart />
                <HeartRateAnalyticsChart />
                <SpO2AnalyticsChart />
                <SessionUsersTable />
                <SessionCompletionChart />
            </div>
        </section>
    );
}
