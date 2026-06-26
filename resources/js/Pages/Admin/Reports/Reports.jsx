import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { authService, getErrorMessage } from "../../Auth/services/authService";
import { useToast } from "../../Global/Toast";
import ReportsHeader from "./components/ReportsHeader";
import ReportsToolbar from "./components/ReportsToolbar";
import ReportsTable from "./components/ReportsTable";
import ReportPreviewDrawer from "./components/ReportPreviewDrawer";
import EmptyState from "./components/EmptyState";

const defaultRange = {
    dateFrom: new Date().toISOString().slice(0, 10),
    timeFrom: "07:00",
    dateTo: new Date().toISOString().slice(0, 10),
    timeTo: "17:00",
};

const revealContainerVariants = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.08,
        },
    },
};

const revealItemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.32, ease: "easeOut" },
    },
};

export default function Reports({ navigate }) {
    const { showToast } = useToast();
    const [range, setRange] = useState(defaultRange);
    const [generatedReports, setGeneratedReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const shouldReduceMotion = useReducedMotion();

    const handleRangeChange = (key, value) => {
        setRange((current) => ({ ...current, [key]: value }));
    };

    const handleGenerateReport = () => {
        authService.adminReports({
            date_from: range.dateFrom,
            time_from: range.timeFrom,
            date_to: range.dateTo,
            time_to: range.timeTo,
        })
            .then((response) => setGeneratedReports(response.data?.data || []))
            .catch((error) => {
                showToast({
                    type: "error",
                    title: "Report unavailable",
                    message: getErrorMessage(error, "Unable to generate the report right now."),
                });

                if (error?.response?.status === 401 || error?.response?.status === 403) {
                    navigate("/login");
                }
            });
    };

    const handleRefresh = () => {
        setGeneratedReports([]);
        setSelectedReport(null);
    };

    const contentInitial = shouldReduceMotion ? { opacity: 1 } : "hidden";
    const contentAnimate = shouldReduceMotion ? { opacity: 1 } : "show";
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

    return (
        <motion.div
            initial={contentInitial}
            animate={contentAnimate}
            variants={containerVariants}
            className="mt-5 space-y-5"
        >
            <motion.div variants={sectionVariants} transformTemplate={(_, generated) => `${generated} translateZ(0)`} style={{ willChange: "transform, opacity" }}>
                <ReportsHeader />
            </motion.div>
            <motion.div variants={sectionVariants} transformTemplate={(_, generated) => `${generated} translateZ(0)`} style={{ willChange: "transform, opacity" }}>
                <ReportsToolbar
                    range={range}
                    onRangeChange={handleRangeChange}
                    onGenerate={handleGenerateReport}
                    onRefresh={handleRefresh}
                />
            </motion.div>

            <motion.div variants={sectionVariants} transformTemplate={(_, generated) => `${generated} translateZ(0)`} style={{ willChange: "transform, opacity" }}>
                {generatedReports.length ? (
                    <ReportsTable reports={generatedReports} onPreview={setSelectedReport} />
                ) : (
                    <EmptyState
                        title="No generated report yet"
                        description="Select the date and time range above, then click Generate report to display report data."
                    />
                )}
            </motion.div>

            <ReportPreviewDrawer report={selectedReport} open={Boolean(selectedReport)} onClose={() => setSelectedReport(null)} />
        </motion.div>
    );
}
