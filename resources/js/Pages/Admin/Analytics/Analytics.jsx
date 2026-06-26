import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
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

const revealContainerVariants = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.06,
        },
    },
};

const revealItemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.34, ease: "easeOut" },
    },
};

const chartRevealContainerVariants = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.06,
        },
    },
};

export default function Analytics({ navigate }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [analyticsData, setAnalyticsData] = useState(null);
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        let alive = true;

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

        return () => {
            alive = false;
        };
    }, [navigate, showToast]);

    if (loading) {
        return <AnalyticsSkeleton />;
    }

    const contentInitial = shouldReduceMotion ? { opacity: 1 } : { opacity: 0 };
    const contentAnimate = { opacity: 1 };
    const sectionVariants = shouldReduceMotion
        ? {
            hidden: { opacity: 1, y: 0 },
            show: { opacity: 1, y: 0, transition: { duration: 0.01 } },
        }
        : revealItemVariants;
    const containerVariants = shouldReduceMotion
        ? {
            hidden: {},
            show: { transition: { staggerChildren: 0 } },
        }
        : revealContainerVariants;
    const chartContainerVariants = shouldReduceMotion
        ? {
            hidden: {},
            show: { transition: { staggerChildren: 0 } },
        }
        : chartRevealContainerVariants;

    return (
        <motion.div
            initial={contentInitial}
            animate={contentAnimate}
            exit={{ opacity: 0 }}
            transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 0.24, ease: "easeOut" }}
            variants={containerVariants}
            className="mt-6 space-y-6"
        >
            <motion.div
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={shouldReduceMotion ? { duration: 0.01 } : { delay: 0.08, duration: 0.3, ease: "easeOut" }}
                transformTemplate={(_, generated) => `${generated} translateZ(0)`}
                style={{ willChange: "transform, opacity" }}
            >
                <AnalyticsHeader />
            </motion.div>
            <motion.div
                initial={shouldReduceMotion ? "show" : "hidden"}
                animate="show"
                variants={{
                    hidden: {},
                    show: {
                        transition: shouldReduceMotion
                            ? { staggerChildren: 0 }
                            : { delayChildren: 0.52, staggerChildren: 0.06 },
                    },
                }}
                transformTemplate={(_, generated) => `${generated} translateZ(0)`}
                style={{ willChange: "transform, opacity" }}
            >
                <AnalyticsInsightsPanel data={analyticsData} />
            </motion.div>

            <motion.section
                initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={shouldReduceMotion ? { duration: 0.01 } : { delay: 0.92, duration: 0.34, ease: "easeOut" }}
                transformTemplate={(_, generated) => `${generated} translateZ(0)`}
                style={{ willChange: "transform, opacity" }}
            >
                <SectionHeader title="Clinical trend charts" description="Vitals, BMI, session activity, and alert patterns from kiosk records." />
                <motion.div className="grid gap-4 xl:grid-cols-2" variants={chartContainerVariants}>
                    <motion.div className="h-full" variants={sectionVariants} transformTemplate={(_, generated) => `${generated} translateZ(0)`}>
                        <SessionChart data={analyticsData?.session_analytics} />
                    </motion.div>
                    <motion.div className="h-full" variants={sectionVariants} transformTemplate={(_, generated) => `${generated} translateZ(0)`}>
                        <TemperatureChart data={analyticsData?.temperature_trend || []} />
                    </motion.div>
                    <motion.div className="h-full" variants={sectionVariants} transformTemplate={(_, generated) => `${generated} translateZ(0)`}>
                        <AlertsChart data={analyticsData?.common_alerts} />
                    </motion.div>
                    <motion.div className="h-full" variants={sectionVariants} transformTemplate={(_, generated) => `${generated} translateZ(0)`}>
                        <BMIChart data={analyticsData?.bmi_distribution || []} />
                    </motion.div>
                    <motion.div className="h-full" variants={sectionVariants} transformTemplate={(_, generated) => `${generated} translateZ(0)`}>
                        <HeartRateChart data={analyticsData?.heart_rate_trend || []} />
                    </motion.div>
                    <motion.div className="h-full" variants={sectionVariants} transformTemplate={(_, generated) => `${generated} translateZ(0)`}>
                        <SpO2Chart data={analyticsData?.spo2_trend || []} />
                    </motion.div>
                    <motion.div className="h-full" variants={sectionVariants} transformTemplate={(_, generated) => `${generated} translateZ(0)`}>
                        <WeeklyChart data={analyticsData?.vital_trend_analytics} />
                    </motion.div>
                    <motion.div className="h-full" variants={sectionVariants} transformTemplate={(_, generated) => `${generated} translateZ(0)`}>
                        <MonthlyChart data={analyticsData?.session_trend_analytics} />
                    </motion.div>
                    <motion.div className="h-full xl:col-span-2" variants={sectionVariants} transformTemplate={(_, generated) => `${generated} translateZ(0)`}>
                        <ActivityHeatmapChart data={analyticsData?.heatmap} />
                    </motion.div>
                </motion.div>
            </motion.section>

        </motion.div>
    );
}
