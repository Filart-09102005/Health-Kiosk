import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AnalyticsHeader from "./components/AnalyticsHeader";
import AnalyticsInsightsPanel from "./components/AnalyticsInsightsPanel";
import AnalyticsSkeleton from "./components/AnalyticsSkeleton";
import BMIChart from "./components/BMI-Chart";
import HeartRateChart from "./components/HeartRate-Chart";
import ActivityHeatmapChart from "./components/ActivityHeatmap-Chart";
import MonthlyChart from "./components/Monthly-Chart";
import AlertsChart from "./components/Alerts-Chart";
import SectionHeader from "./components/SectionHeader";
import SessionChart from "./components/Session-Chart";
import SpO2Chart from "./components/SpO2-Chart";
import TemperatureChart from "./components/Temperature-Chart";
import WeeklyChart from "./components/Weekly-Chart";
import { authService, getErrorMessage } from "../../Auth/services/authService";
import { useToast } from "../../Global/Toast";

export default function Analytics({ navigate }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [analyticsData, setAnalyticsData] = useState(null);

    useEffect(() => {
        let alive = true;
        const timer = window.setTimeout(() => {
            authService
                .adminAnalytics()
                .then((response) => {
                    if (alive) setAnalyticsData(response.data);
                })
                .catch((error) => {
                    if (alive) {
                        setAnalyticsData(null);
                        
                        showToast({
                            type: "error",
                            title: "Session Expired",
                            message: getErrorMessage(error, "You must log in to access this page."),
                        });

                        if (error?.response?.status === 401 || error?.response?.status === 403) {
                            navigate("/login");
                        }
                    }
                })
                .finally(() => {
                    if (alive) setLoading(false);
                });
        }, 600);

        return () => {
            alive = false;
            window.clearTimeout(timer);
        };
    }, [navigate, showToast]);

    if (loading) {
        return <AnalyticsSkeleton />;
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.28 }} className="mt-6 space-y-6">
            <AnalyticsHeader />
            <AnalyticsInsightsPanel />

            <section>
                <SectionHeader title="Clinical trend charts" description="Vitals, BMI, session activity, and alert patterns from kiosk records." />
                <div className="grid gap-4 xl:grid-cols-2">
                    <SessionChart data={analyticsData?.session_analytics} />
                    <AlertsChart data={analyticsData?.common_alerts} />
                    <TemperatureChart />
                    <BMIChart />
                    <HeartRateChart />
                    <SpO2Chart />
                    <WeeklyChart />
                    <MonthlyChart />
                    <div className="xl:col-span-2">
                        <ActivityHeatmapChart data={analyticsData?.heatmap} />
                    </div>
                </div>
            </section>

        </motion.div>
    );
}
