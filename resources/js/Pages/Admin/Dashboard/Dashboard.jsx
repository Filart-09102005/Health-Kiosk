import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { authService, getErrorMessage } from "../../Auth/services/authService";
import { useToast } from "../../Global/Toast";
import DashboardCharts from "./components/DashboardCharts";
import DashboardSkeleton from "./components/DashboardSkeleton";
import StatsGrid from "./components/StatsGrid";
import WelcomeBanner from "./components/WelcomeBanner";

export default function Dashboard({ navigate }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [period, setPeriod] = useState("weekly");
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        let alive = true;

        if (!dashboardData) setLoading(true);

        authService
            .adminDashboard({ period })
            .then((response) => {
                if (alive) setDashboardData(response.data);
            })
            .catch((error) => {
                if (alive) {
                    setDashboardData(null);

                    showToast({
                        type: "error",
                        title: "Dashboard unavailable",
                        message: getErrorMessage(error, "Unable to load the admin dashboard right now."),
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
    }, [navigate, showToast, period]);

    if (loading && !dashboardData) {
        return <DashboardSkeleton />;
    }

    return (
        <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 0.24, ease: "easeOut" }}
            className="mt-6 space-y-6"
        >
            <WelcomeBanner />
            <StatsGrid stats={dashboardData?.stats || []} />
            <DashboardCharts data={dashboardData} period={period} onPeriodChange={setPeriod} />
        </motion.div>
    );
}
