import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { authService, getErrorMessage } from "../../Auth/services/authService";
import { useToast } from "../../Global/Toast";
import ReportsHeader from "./components/ReportsHeader";
import ReportsToolbar from "./components/ReportsToolbar";
import ReportsTable from "./components/ReportsTable";
import ReportPreviewDrawer from "./components/ReportPreviewDrawer";
import EmptyState from "./components/EmptyState";
import ReportGenerationOverlay, { GENERATION_MIN_MS } from "./components/ReportGenerationOverlay";

const defaultRange = {
    dateFrom: new Date().toISOString().slice(0, 10),
    timeFrom: "07:00",
    dateTo: new Date().toISOString().slice(0, 10),
    timeTo: "17:00",
};

const defaultFilters = {
    department: "",
    program: [],
    strand: [],
    year_level: [],
    grade_level: [],
    gender: "",
};

const emptyFilterOptions = {
    departments: [],
    programs: [],
    strands: [],
    year_levels: [],
    grade_levels: [],
    genders: [],
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
    const [filters, setFilters] = useState(defaultFilters);
    const [filterOptions, setFilterOptions] = useState(emptyFilterOptions);
    const [generatedReports, setGeneratedReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    // null while idle; { status, count } drives the generation sequence.
    const [generation, setGeneration] = useState(null);
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        let alive = true;

        authService.adminReportFilterOptions()
            .then((response) => {
                if (alive) setFilterOptions({ ...emptyFilterOptions, ...(response.data || {}) });
            })
            .catch((error) => {
                showToast({
                    type: "error",
                    title: "Filters unavailable",
                    message: getErrorMessage(error, "Unable to load report filter options."),
                });
            });

        // Deliberately no report load here. Fetching on mount meant the results
        // table was already on screen before anyone asked for it, listing every
        // report type at "0 records" - which reads as though a report had been
        // generated and came back empty. The empty state now stands until the
        // admin actually clicks Generate report.

        return () => {
            alive = false;
        };
    }, [showToast]);

    const handleRangeChange = (key, value) => {
        setRange((current) => ({ ...current, [key]: value }));
    };

    const handleFilterChange = (key, value) => {
        setFilters((current) => {
            const next = { ...current, [key]: value };

            if (key === "department") {
                next.program = [];
                next.strand = [];
                next.year_level = [];
                next.grade_level = [];
            }

            return next;
        });
    };

    const handleSetArrayFilter = (key, value) => {
        setFilters((current) => {
            return { ...current, [key]: value ? [value] : [] };
        });
    };

    /**
     * @param {boolean} withOverlay  Show the generation sequence. False for the
     *                               silent load on mount — nobody asked for that
     *                               one, so it should not take over the screen.
     */
    const handleGenerateReport = (withOverlay = false) => {
        if (withOverlay) setGeneration({ status: "running", count: 0 });

        const startedAt = performance.now();

        authService.adminReports({
            date_from: range.dateFrom,
            time_from: range.timeFrom,
            date_to: range.dateTo,
            time_to: range.timeTo,
            department: filters.department || undefined,
            program: filters.program,
            strand: filters.strand,
            year_level: filters.year_level,
            grade_level: filters.grade_level,
            gender: filters.gender || undefined,
        })
            .then((response) => {
                const rows = response.data?.data || [];
                setGeneratedReports(rows);

                if (!withOverlay) return;

                // Success waits for the data AND for the stages to have played
                // through, so a fast response still reads as a sequence rather
                // than a flash — but a slow one is never cut short.
                const elapsed = performance.now() - startedAt;
                window.setTimeout(
                    () => setGeneration({ status: "success", count: rows.length }),
                    Math.max(GENERATION_MIN_MS - elapsed, 0),
                );
            })
            .catch((error) => {
                // The overlay switches to its error state rather than vanishing,
                // so the progress animation stops and the admin gets a retry in
                // place instead of a toast that scrolls away. The silent load on
                // mount has no overlay to switch, so it still toasts.
                if (withOverlay) {
                    setGeneration({ status: "error", count: 0 });
                } else {
                    setGeneration(null);

                    showToast({
                        type: "error",
                        title: "Report unavailable",
                        message: getErrorMessage(error, "Unable to generate the report right now."),
                    });
                }

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
            <motion.div
                variants={sectionVariants}
                transformTemplate={(_, generated) => `${generated} translateZ(0)`}
                className="relative z-20"
                style={{ willChange: "transform, opacity" }}
            >
                <ReportsToolbar
                    range={range}
                    filters={filters}
                    filterOptions={filterOptions}
                    onRangeChange={handleRangeChange}
                    onFilterChange={handleFilterChange}
                    onSetArrayFilter={handleSetArrayFilter}
                    onGenerate={() => handleGenerateReport(true)}
                    onRefresh={handleRefresh}
                />
            </motion.div>

            <motion.div
                variants={sectionVariants}
                transformTemplate={(_, generated) => `${generated} translateZ(0)`}
                className="relative z-0"
                style={{ willChange: "transform, opacity" }}
            >
                {generatedReports.length ? (
                    <ReportsTable reports={generatedReports} onPreview={setSelectedReport} filters={filters} range={range} />
                ) : (
                    <EmptyState
                        className="-mt-3 rounded-t-[10px] pt-12"
                        title="No reports generated yet"
                        description="Choose a date range and any filters above, then click Generate report to build your clinic reports."
                    />
                )}
            </motion.div>

            <ReportPreviewDrawer report={selectedReport} open={Boolean(selectedReport)} onClose={() => setSelectedReport(null)} />

            <ReportGenerationOverlay
                open={Boolean(generation)}
                status={generation?.status || "running"}
                count={generation?.count || 0}
                onDone={() => setGeneration(null)}
                onRetry={() => handleGenerateReport(true)}
            />
        </motion.div>
    );
}
