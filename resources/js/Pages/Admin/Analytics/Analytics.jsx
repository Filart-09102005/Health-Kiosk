import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Activity, AlertTriangle, Bell, CalendarClock, Check, CheckCircle, ChevronDown, Filter, HeartPulse, RotateCcw, Search, Thermometer, UsersRound, Weight } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import AnalyticsSkeleton from "./components/AnalyticsSkeleton";
import AnalyticsAsidePanel from "./components/AnalyticsAsidePanel";
import AsideDonutChart from "./components/AsideDonutChart";
import RiskSummaryRadialChart from "./components/RiskSummaryRadialChart";
import SectionHeader from "./components/SectionHeader";
import BmiDistributionChart from "./components/BmiDistributionChart";
import HeartRateDistributionChart from "./components/HeartRateDistributionChart";
import SpO2DistributionChart from "./components/SpO2DistributionChart";
import TemperatureDistributionChart from "./components/TemperatureDistributionChart";
import { authService, getErrorMessage } from "../../Auth/services/authService";
import { useToast } from "../../Global/Toast";
import { cardClassName, cardStyle } from "./utils/surface";
import AlertDetailsDrawer from "../Alerts/components/AlertDetailsDrawer";

const today = new Date().toISOString().slice(0, 10);
const startDate = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const defaultFilters = {
    date_from: startDate,
    date_to: today,
    academic_level: "",
    grade_level: "",
    section: "",
    strand: "",
    program: "",
    year_level: "",
    gender: "",
    period: "monthly",
};

const summaryCards = [
    ["total_students_measured", "Total Students Measured", UsersRound, "", "Filtered student records"],
    ["average_bmi", "Average BMI", Weight, "", "Current cohort average"],
    ["average_heart_rate", "Average Heart Rate", HeartPulse, "bpm", "Pulse reading average"],
    ["average_spo2", "Average SpO2", Activity, "%", "Oxygen saturation average"],
    ["average_temperature", "Average Temperature", Thermometer, "C", "Body temperature average"],
];

const chartColors = [
    "var(--health-bmi)",
    "var(--clinical-normal)",
    "var(--color-warning)",
    "var(--color-error)",
    "var(--health-spo2)",
];

const clinicalColorMap = {
    // ── Specific compound names (must come before short keys) ──
    "low spo2":         "var(--clinical-low-spo2)",
    "high spo2":        "var(--clinical-high-spo2)",
    "low temperature":  "var(--clinical-low-temp)",
    "high temperature": "var(--clinical-high-temp)",
    "low heart":        "var(--clinical-low-hr)",
    "high heart":       "var(--clinical-high-hr)",
    // ── Single-word categories ──
    normal:             "var(--clinical-normal)",
    healthy:            "var(--clinical-normal)",
    elevated:           "var(--clinical-elevated)",
    underweight:        "var(--clinical-underweight)",
    overweight:         "var(--clinical-overweight)",
    obese:              "var(--clinical-obese)",
    // ── Generic fallbacks ──
    low:                "var(--color-warning)",
    high:               "var(--color-error)",
    watch:              "var(--color-warning)",
    alert:              "var(--color-error)",
};

const riskColorMap = {
    underweight:      "var(--clinical-underweight)",
    overweight:       "var(--clinical-overweight)",
    obese:            "var(--clinical-obese)",
    abnormal_hr:      "var(--health-heart-rate)",
    low_heart_rate:   "var(--clinical-low-hr)",
    high_heart_rate:  "var(--clinical-high-hr)",
    low_spo2:         "var(--clinical-low-spo2)",
    high_spo2:        "var(--clinical-high-spo2)",
    low_temperature:  "var(--clinical-low-temp)",
    high_temperature: "var(--clinical-high-temp)",
};

const trendColorMap = {
    average_bmi:         "var(--health-bmi)",
    average_heart_rate:  "var(--health-heart-rate)",
    average_spo2:        "var(--health-spo2)",
    average_temperature: "var(--health-temperature)",
};

const riskSignalCategories = [
    { key: "underweight", label: "Underweight", title: "Underweight Cases" },
    { key: "overweight", label: "Overweight", title: "Overweight Cases" },
    { key: "obese", label: "Obese", title: "Obese Cases" },
    { key: "low_heart_rate", label: "Low Heart Rate", title: "Low Heart Rate Cases" },
    { key: "high_heart_rate", label: "High Heart Rate", title: "High Heart Rate Cases" },
    { key: "low_spo2", label: "Low SpO2", title: "Low SpO2 Cases" },
    { key: "high_spo2", label: "High SpO2", title: "High SpO2 Cases" },
    { key: "low_temperature", label: "Low Temperature", title: "Low Temperature Cases" },
    { key: "high_temperature", label: "High Temperature", title: "High Temperature Cases" },
];

const alertTypeConfig = {
    temperature: { label: "Temperature", color: "var(--health-temperature)", Icon: Thermometer },
    heart_rate:  { label: "Heart Rate",  color: "var(--health-heart-rate)",  Icon: HeartPulse },
    spo2:        { label: "SpO\u2082",   color: "var(--health-spo2)",        Icon: Activity },
    bmi:         { label: "BMI",         color: "var(--health-bmi)",         Icon: Weight },
};

const revealContainerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.04 } },
};

const revealItemVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.26, ease: "easeOut" } },
};

export default function Analytics({ navigate }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [filters, setFilters] = useState(defaultFilters);
    const [draftFilters, setDraftFilters] = useState(defaultFilters);
    const [followUpSearch, setFollowUpSearch] = useState("");
    const [drawerAlert, setDrawerAlert] = useState(null);
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        let alive = true;
        setRefreshing(Boolean(analyticsData));

        authService
            .adminAnalytics(filters)
            .then((response) => {
                if (alive) setAnalyticsData(response.data);
            })
            .catch((error) => {
                if (!alive) return;

                setAnalyticsData(null);
                showToast({
                    type: "error",
                    title: "Analytics unavailable",
                    message: getErrorMessage(error, "Unable to load measurement analytics."),
                });

                if (error?.response?.status === 401 || error?.response?.status === 403) {
                    navigate("/login");
                }
            })
            .finally(() => {
                if (alive) {
                    setLoading(false);
                    setRefreshing(false);
                }
            });

        return () => {
            alive = false;
        };
    }, [filters, navigate, showToast]);

    const handleFilterChange = (key, value) => {
        setDraftFilters((current) => {
            const next = { ...current, [key]: value };

            if (key === "academic_level") {
                next.grade_level = "";
                next.section = "";
                next.strand = "";
                next.program = "";
                next.year_level = "";
            }

            if (key === "grade_level" && value && !isSeniorHighGrade(value)) {
                next.strand = "";
            }

            return next;
        });
    };

    const handleApplyFilters = () => {
        setFilters(draftFilters);
    };

    const handleResetFilters = () => {
        setDraftFilters(defaultFilters);
        setFilters(defaultFilters);
    };

    const handlePeriodChange = (period) => {
        setDraftFilters((current) => ({ ...current, period }));
        setFilters((current) => ({ ...current, period }));
    };

    const followUpRows = useMemo(() => {
        const rows = analyticsData?.follow_up_students || [];
        const term = followUpSearch.trim().toLowerCase();

        if (!term) return rows;

        return rows.filter((row) =>
            [row.student_id, row.name, row.academic_information, row.bmi_status, row.heart_rate_status, row.spo2_status, row.temperature_status]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(term)),
        );
    }, [analyticsData, followUpSearch]);

    const summaryItems = useMemo(() => {
        const summary = analyticsData?.summary || {};
        const warningCases = (analyticsData?.health_status_summary || [])
            .reduce((sum, item) => sum + (Number(item.count) || 0), 0);
        const latestMeasured = followUpRows?.[0]?.date_measured || analyticsData?.latest_measurement_date || "No records";

        return [
            ...summaryCards.map(([key, label, Icon, suffix, subtext]) => ({
                key,
                label,
                Icon,
                value: summary[key] ?? 0,
                suffix,
                subtext,
                tone: key === "average_bmi" && Number(summary[key]) >= 30 ? "warning" : "primary",
            })),
            {
                key: "latest_measurement",
                label: "Latest Measurement",
                Icon: CalendarClock,
                value: latestMeasured,
                suffix: "",
                subtext: "Most recent filtered record",
                tone: "primary",
                compact: true,
            },
        ];
    }, [analyticsData, followUpRows]);

    if (loading) {
        return <AnalyticsSkeleton />;
    }

    const sectionVariants = shouldReduceMotion
        ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0, transition: { duration: 0.01 } } }
        : revealItemVariants;

    const containerVariants = shouldReduceMotion
        ? { hidden: {}, show: { transition: { staggerChildren: 0 } } }
        : revealContainerVariants;

    return (
        <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : "hidden"}
            animate="show"
            variants={containerVariants}
            className={`mt-6 space-y-6 transition-opacity ${refreshing ? "opacity-80" : "opacity-100"}`}
        >
            <motion.div variants={sectionVariants}>
                <AnalyticsHeader />
            </motion.div>

            <motion.div variants={sectionVariants} className="relative z-10">
                <AnalyticsFilters
                    filters={draftFilters}
                    options={analyticsData?.filters || {}}
                    onChange={handleFilterChange}
                    onApply={handleApplyFilters}
                    onReset={handleResetFilters}
                />
            </motion.div>

            <motion.section variants={sectionVariants} className="relative z-0 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {summaryItems.map((item) => (
                    <SummaryCard key={item.key} {...item} />
                ))}
            </motion.section>

            <motion.section variants={sectionVariants}>
                <div className="grid items-stretch gap-4 2xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                    <RiskSummaryRadialChart
                        className="2xl:h-full"
                        data={(analyticsData?.health_status_summary || []).map((item, index) => ({
                            key: item.key,
                            label: item.label,
                            detail: riskSummaryDescription(item.key),
                            value: Number(item.count) || 0,
                            color: statusRiskColor(item.key, index),
                        })).filter((item) => item.value > 0)}
                        totalLabel="cases"
                    />
                    <motion.aside variants={sectionVariants} className="flex h-full flex-col gap-4 2xl:min-h-0">
                        <div className="flex h-full min-h-0 flex-col 2xl:flex-[58]">
                            <AnalyticsAside filters={filters} summaryItems={summaryItems} analyticsData={analyticsData} followUpCount={followUpRows.length} />
                        </div>
                        <div className="flex h-full min-h-0 flex-col 2xl:flex-[42]">
                            <TopRiskSignalsAside insights={analyticsData?.panel_insights || []} />
                        </div>
                    </motion.aside>
                </div>
            </motion.section>

            <motion.section variants={sectionVariants}>
                <PanelInsights insights={analyticsData?.panel_insights || []} summary={analyticsData?.health_status_summary || []} />
            </motion.section>

            <motion.section variants={sectionVariants}>
                <SectionHeader title="Health measurement distributions" description="Clinical category breakdowns from the selected student measurement records." />
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    <BmiDistributionChart data={normalizeDistributionData(analyticsData?.bmi_distribution || [])} />
                    <TemperatureDistributionChart data={normalizeDistributionData(analyticsData?.temperature_distribution || [])} />
                    <HeartRateDistributionChart data={normalizeDistributionData(analyticsData?.heart_rate_distribution || [])} />
                    <SpO2DistributionChart data={normalizeDistributionData(analyticsData?.spo2_distribution || [])} />
                </div>
            </motion.section>

            <motion.section variants={sectionVariants}>
                <AcademicComparisonChart data={analyticsData?.academic_comparisons || {}} />
            </motion.section>

            <motion.section variants={sectionVariants}>
                <AcademicRiskChart data={analyticsData?.academic_risk_breakdown || {}} />
            </motion.section>

            <motion.section variants={sectionVariants}>
                <TrendPanel
                    data={analyticsData?.health_trends || []}
                    period={filters.period}
                    onPeriodChange={handlePeriodChange}
                />
            </motion.section>

            <motion.section variants={sectionVariants}>
                <FollowUpTable rows={followUpRows} search={followUpSearch} onSearch={setFollowUpSearch} />
            </motion.section>

            <motion.section variants={sectionVariants}>
                <AlertAnalyticsSection
                    data={analyticsData?.alert_analytics}
                    onViewAlert={setDrawerAlert}
                />
            </motion.section>

            <AlertDetailsDrawer
                alert={drawerAlert}
                open={Boolean(drawerAlert)}
                onClose={() => setDrawerAlert(null)}
                onResolved={() => {
                    setDrawerAlert(null);
                    setFilters((f) => ({ ...f }));
                }}
            />
        </motion.div>
    );
}

function AnalyticsHeader() {
    return (
        <section className={`${cardClassName} overflow-hidden p-5 sm:p-6`} style={cardStyle}>
            <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: "var(--color-primary)" }}>Health Data Analytics</p>
            <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-4xl">
                <h1 className="text-3xl font-black sm:text-4xl">Measurement Analytics</h1>
                <p className="mt-3 text-sm font-bold leading-6 sm:text-base" style={{ color: "var(--color-muted)" }}>
                    Analyze student health measurements, identify trends, and support clinic follow-up decisions.
                </p>
                <p className="mt-2 text-xs font-bold" style={{ color: "var(--color-muted)" }}>
                    Filtered analytics are based on selected date range and student profile filters.
                </p>
                </div>
                <div className="inline-flex w-fit items-center gap-2 rounded-[14px] border px-3 py-2 text-xs font-black" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-muted)" }}>
                    <Filter size={15} style={{ color: "var(--color-primary)" }} />
                    For monitoring and clinic follow-up only
                </div>
            </div>
        </section>
    );
}

function AnalyticsAside({ filters, summaryItems, analyticsData, followUpCount }) {
    const primaryStats = summaryItems.filter((item) => ["total_students_measured", "latest_measurement"].includes(item.key));
    const latestMeasurement = primaryStats.find((item) => item.key === "latest_measurement");
    const decisionChartData = [
        {
            key: "total_students_measured",
            label: "Students Measured",
            detail: "Filtered student records",
            value: Number(primaryStats.find((item) => item.key === "total_students_measured")?.value) || 0,
            color: "#3b82f6",
        },
        {
            key: "follow_up_count",
            label: "Follow-up Rows",
            detail: "Visible in clinical list",
            value: Number(followUpCount) || 0,
            color: "#a855f7",
        },
    ].filter((item) => item.value > 0);

    return (
        <AnalyticsAsidePanel
            fillHeight
            className="h-full"
            eyebrow="Analytics Aside"
            title="Clinic decision summary"
            description="Snapshot of the selected cohort, risk pressure, and follow-up workload."
            footer={(
                <div className="rounded-[14px] border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                    <p className="text-[0.68rem] font-black uppercase tracking-[0.12em]" style={{ color: "var(--color-muted)" }}>Latest Measurement</p>
                    <p className="mt-2 text-sm font-black">{latestMeasurement?.value || "No records"}</p>
                    <p className="mt-1 text-xs font-bold leading-5" style={{ color: "var(--color-muted)" }}>
                        Most recent filtered record
                    </p>
                </div>
            )}
        >
            <AsideDonutChart
                data={decisionChartData}
                totalLabel="tracked"
                valueSuffix=""
                chartVariant="half"
            />
        </AnalyticsAsidePanel>
    );
}

function TopRiskSignalsAside({ insights }) {
    const topRisks = (insights || []).slice(0, 4);
    const topRiskChartData = topRisks.map((risk, index) => ({
        key: `${risk.key}-${risk.label}`,
        label: risk.title,
        detail: `${risk.group_type}: ${risk.label}`,
        value: Number(risk.count) || 0,
        color: insightColor(risk.key, index),
    })).filter((item) => item.value > 0);

    return (
        <AnalyticsAsidePanel
            fillHeight
            className="h-full"
            title="Top Risk Signals"
            titleClassName="text-sm font-black"
            description="Highest academic risk groups from the selected filters."
            descriptionClassName="mt-1 text-xs font-bold leading-5"
            isEmpty={!topRiskChartData.length}
            emptyMessage="No active academic risk signals in the selected filters."
        >
            <AsideDonutChart
                data={topRiskChartData}
                totalLabel="risk signals"
                valueSuffix=""
                chartVariant="full"
            />
        </AnalyticsAsidePanel>
    );
}

function AsideStat({ item }) {
    const Icon = item.Icon;
    const toneColor = item.tone === "warning" ? "var(--color-error)" : item.tone === "success" ? "var(--color-success)" : "var(--color-primary)";

    return (
        <div className="rounded-[14px] border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.11em]" style={{ color: "var(--color-muted)" }}>{item.label}</p>
                    <p className={`mt-2 font-black leading-tight ${item.compact ? "text-sm" : "text-2xl"}`}>
                        {item.value}{item.suffix ? <span className="ml-1 text-xs" style={{ color: "var(--color-muted)" }}>{item.suffix}</span> : null}
                    </p>
                    {item.subtext ? <p className="mt-1 text-xs font-bold leading-5" style={{ color: "var(--color-muted)" }}>{item.subtext}</p> : null}
                </div>
                {Icon ? (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px]" style={{ backgroundColor: "var(--color-card)", color: toneColor }}>
                        <Icon size={16} />
                    </span>
                ) : null}
            </div>
        </div>
    );
}

function AnalyticsFilters({ filters, options, onChange, onApply, onReset }) {
    const dept = String(filters.academic_level || "").toUpperCase();
    const isCollege = dept === "COLLEGE";
    const isBasicEducation = dept === "BED";
    const showStrand = isBasicEducation && (!filters.grade_level || isSeniorHighGrade(filters.grade_level));

    return (
        <section className={`${cardClassName} p-4 sm:p-5`} style={cardStyle}>
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-primary)" }}>Analytics Controls</p>
                    <h2 className="mt-1 text-lg font-black">Filter measurement records</h2>
                    <p className="mt-1 text-xs font-bold leading-5" style={{ color: "var(--color-muted)" }}>Filters are based on existing registered student data.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={onReset}
                        className="inline-flex h-11 items-center gap-2 rounded-[12px] border px-4 text-sm font-black transition hk-admin-nav-hover"
                        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text)" }}
                    >
                        <RotateCcw size={16} />
                        Reset
                    </button>
                    <button
                        type="button"
                        onClick={onApply}
                        className="inline-flex h-11 items-center gap-2 rounded-[12px] px-4 text-sm font-black text-white transition hk-admin-nav-hover"
                        style={{ backgroundColor: "var(--color-primary)" }}
                    >
                        <Filter size={16} />
                        Apply Filters
                    </button>
                </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <InputField label="Date From" type="date" value={filters.date_from} onChange={(value) => onChange("date_from", value)} />
                <InputField label="Date To" type="date" value={filters.date_to} onChange={(value) => onChange("date_to", value)} />
                <SelectField label="Academic Level" value={filters.academic_level} options={options.academic_levels || []} onChange={(value) => onChange("academic_level", value)} />
                <SelectField label="Gender" value={filters.gender} options={options.genders || []} onChange={(value) => onChange("gender", value)} />

                {isBasicEducation ? (
                    <>
                        <SelectField label="Grade Level" value={filters.grade_level} options={options.grade_levels || []} onChange={(value) => onChange("grade_level", value)} />
                        {showStrand ? <SelectField label="Senior High Program" value={filters.strand} options={options.strands || []} onChange={(value) => onChange("strand", value)} /> : null}
                        {(options.sections || []).length ? <SelectField label="Section" value={filters.section} options={options.sections || []} onChange={(value) => onChange("section", value)} /> : null}
                    </>
                ) : null}

                {isCollege ? (
                    <>
                        <SelectField label="College Course" value={filters.program} options={options.programs || []} onChange={(value) => onChange("program", value)} />
                        <SelectField label="Year Level" value={filters.year_level} options={options.year_levels || []} onChange={(value) => onChange("year_level", value)} />
                    </>
                ) : null}
            </div>
            <p className="mt-4 rounded-[12px] border px-3 py-2 text-xs font-bold" style={{ color: "var(--color-muted)", borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                If a grade, strand, or course is not listed, there is no matching database value for the selected cohort yet.
            </p>
        </section>
    );
}

function InputField({ label, type, value, onChange }) {
    return (
        <label className="block">
            <span className="text-[0.68rem] font-black uppercase tracking-[0.16em]" style={{ color: "var(--color-muted)" }}>{label}</span>
            <input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-2 h-11 w-full rounded-[12px] border px-3 text-sm font-black outline-none"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
            />
        </label>
    );
}

function SelectField({ label, value, options, onChange }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const selectedLabel = value ? formatLabel(value) : "All";

    useEffect(() => {
        if (!open) return undefined;

        const closeOnOutside = (event) => {
            if (!rootRef.current?.contains(event.target)) setOpen(false);
        };
        const closeOnEscape = (event) => {
            if (event.key === "Escape") setOpen(false);
        };

        document.addEventListener("pointerdown", closeOnOutside);
        document.addEventListener("keydown", closeOnEscape);

        return () => {
            document.removeEventListener("pointerdown", closeOnOutside);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [open]);

    const handleSelect = (nextValue) => {
        onChange(nextValue);
        setOpen(false);
    };

    return (
        <div ref={rootRef} className="relative">
            <span className="text-[0.68rem] font-black uppercase tracking-[0.16em]" style={{ color: "var(--color-muted)" }}>{label}</span>
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                className="mt-2 flex h-11 w-full items-center justify-between gap-3 rounded-[12px] border px-3 pr-4 text-left text-sm font-black outline-none transition hk-admin-nav-hover"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className="min-w-0 truncate">{selectedLabel}</span>
                <ChevronDown size={17} className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} style={{ color: "var(--color-muted)" }} />
            </button>

            {open ? (
                <div
                    className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-[14px] border p-1.5 shadow-xl"
                    style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", boxShadow: "0 18px 50px rgba(0, 0, 0, 0.2)" }}
                    role="listbox"
                >
                    <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto pr-1">
                        {[{ value: "", label: "All" }, ...options.map((option) => ({ value: option, label: formatLabel(option) }))].map((option) => {
                            const active = option.value === value;

                            return (
                                <button
                                    key={option.value || "all"}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className="flex min-h-10 w-full items-center justify-between gap-3 rounded-[10px] px-3 py-2 text-left text-sm font-black transition hk-admin-nav-hover"
                                    style={{
                                        backgroundColor: active ? "color-mix(in srgb, var(--color-primary) 12%, transparent)" : "transparent",
                                        color: active ? "var(--color-primary)" : "var(--color-text)",
                                    }}
                                    role="option"
                                    aria-selected={active}
                                >
                                    <span className="min-w-0 truncate">{option.label}</span>
                                    {active ? <Check size={15} className="shrink-0" /> : <span className="h-[15px] w-[15px] shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function SummaryCard({ label, value, suffix, Icon, icon, subtext, tone = "primary", compact = false }) {
    const CardIcon = Icon || icon;
    const toneColor = tone === "warning" ? "var(--color-error)" : tone === "success" ? "var(--color-success)" : "var(--color-primary)";

    return (
        <article className={`${cardClassName} min-h-[132px] p-4`} style={cardStyle}>
            <div className="flex items-center justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[12px]" style={{ backgroundColor: "var(--color-surface)", color: toneColor }}>
                    {CardIcon ? <CardIcon size={20} /> : null}
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em]" style={{ borderColor: "var(--color-border)", color: toneColor, backgroundColor: "var(--color-surface)" }}>
                    {tone === "warning" ? "Needs Review" : tone === "success" ? "Clear" : "Filtered"}
                </span>
            </div>
            <p className={`mt-4 font-black leading-tight ${compact ? "text-base" : "text-3xl"}`}>
                    {value}{suffix ? <span className="ml-1 text-sm" style={{ color: "var(--color-muted)" }}>{suffix}</span> : null}
            </p>
            <p className="mt-3 text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--color-muted)" }}>{label}</p>
            {subtext ? <p className="mt-1 text-xs font-bold leading-5" style={{ color: "var(--color-muted)" }}>{subtext}</p> : null}
        </article>
    );
}

function PanelInsights({ insights, summary }) {
    const chartData = insights.map((insight, index) => ({
        ...insight,
        name: insight.title?.replace(/^Most\s+/i, "") || `Insight ${index + 1}`,
        value: Number(insight.count) || 0,
        color: insightColor(insight.key, index),
        topGroup: `${insight.group_type}: ${insight.label}`,
    }));
    const summaryByKey = new Map((summary || []).map((item) => [item.key, item]));
    const barChartData = riskSignalCategories.map((category, index) => {
        const item = summaryByKey.get(category.key);
        const value = Number(item?.count) || 0;

        return {
            key: category.key,
            title: category.title,
            name: category.label,
            value,
            color: statusRiskColor(category.key, index),
            topGroup: value > 0 ? "Filtered database records" : "No matching records",
            detail: riskSummaryDescription(category.key),
        };
    });
    const totalSignals = barChartData.reduce((sum, insight) => sum + insight.value, 0);
    const highest = [...barChartData].sort((a, b) => b.value - a.value)[0];

    return (
        <section>
            {barChartData.length ? (
                <div className="space-y-4">
                    <div className="overflow-hidden rounded-[22px] border p-4 sm:p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-primary)" }}>Clinic intelligence</p>
                                <h2 className="mt-2 text-lg font-black">Specific academic risk insights</h2>
                                <p className="mt-1 text-xs font-bold leading-5" style={{ color: "var(--color-muted)" }}>
                                    Highest-risk academic signals from the selected filters.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:justify-end">
                                <div className="rounded-[14px] border px-3 py-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
                                    <p className="text-[0.62rem] font-black uppercase tracking-[0.12em]" style={{ color: "var(--color-muted)" }}>Total Signals</p>
                                    <p className="mt-1 text-lg font-black">{totalSignals}</p>
                                </div>
                                <div className="rounded-[14px] border px-3 py-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
                                    <p className="text-[0.62rem] font-black uppercase tracking-[0.12em]" style={{ color: "var(--color-muted)" }}>Highest</p>
                                    <p className="mt-1 max-w-36 truncate text-sm font-black">{highest?.value > 0 ? highest.name : "No data"}</p>
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(20rem,0.82fr)]">
                            <div className="rounded-[18px] border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
                                <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <p className="text-sm font-black">Risk signal bar chart</p>
                                        <p className="mt-1 text-xs font-bold" style={{ color: "var(--color-muted)" }}>
                                            Bar height compares the highest-risk signal counts from selected records.
                                        </p>
                                    </div>
                                    <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--color-muted)" }}>
                                        {totalSignals} tracked
                                    </p>
                                </div>

                                <div className="h-[31rem] w-full">
                                    <ResponsiveContainer debounce={50} width="100%" height="100%">
                                        <BarChart data={barChartData} margin={{ top: 18, right: 18, left: 0, bottom: 18 }}>
                                            <XAxis
                                                dataKey="name"
                                                interval={0}
                                                tickLine={false}
                                                axisLine={false}
                                                tick={{ fill: "var(--color-muted)", fontSize: 10, fontWeight: 900 }}
                                                tickFormatter={(value) => compactLabel(value, 12)}
                                            />
                                            <YAxis
                                                allowDecimals={false}
                                                tickLine={false}
                                                axisLine={false}
                                                tick={{ fill: "var(--color-muted)", fontSize: 10, fontWeight: 900 }}
                                            />
                                            <Tooltip content={<InsightChartTooltip />} cursor={{ fill: "transparent" }} />
                                            <Bar dataKey="value" radius={[14, 14, 6, 6]} barSize={34} isAnimationActive={false}>
                                                {barChartData.map((entry) => (
                                                    <Cell
                                                        key={entry.key || entry.title}
                                                        fill={entry.color}
                                                        style={{ filter: `drop-shadow(0 0 10px color-mix(in srgb, ${entry.color} 35%, transparent))` }}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="grid max-h-[38rem] gap-3 overflow-y-auto pr-1 xl:grid-cols-1">
                                {chartData.length ? (
                                    chartData.map((insight) => (
                                        <InsightDistributionCard key={`${insight.key}-${insight.group_type}-${insight.label}`} insight={insight} />
                                    ))
                                ) : (
                                    <EmptyChart message="No ranked academic risk groups found for the selected filters." />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="rounded-[18px] border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                    <div className="mb-4">
                        <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-primary)" }}>Clinic intelligence</p>
                        <h2 className="mt-2 text-lg font-black">Specific academic risk insights</h2>
                        <p className="mt-1 text-xs font-bold leading-5" style={{ color: "var(--color-muted)" }}>
                            Highest-risk academic signals from the selected filters.
                        </p>
                    </div>
                    <EmptyChart message="No abnormal academic risk pattern found for the selected filters." />
                </div>
            )}
        </section>
    );
}

function InsightChartTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;

    const insight = payload[0].payload;

    return (
        <div className="max-w-[18rem] rounded-[14px] border p-3 shadow-xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-text)" }}>
            <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: insight.color }} />
                <p className="text-sm font-black">{insight.title}</p>
            </div>
            <p className="mt-2 text-xs font-bold" style={{ color: "var(--color-muted)" }}>{insight.topGroup}</p>
            <p className="mt-2 text-2xl font-black" style={{ color: insight.color }}>{insight.value}</p>
            <p className="mt-1 text-xs font-bold leading-5" style={{ color: "var(--color-muted)" }}>{insight.detail}</p>
        </div>
    );
}

function SignalDistributionRow({ insight, maxValue, totalSignals }) {
    const share = totalSignals ? Math.round((insight.value / totalSignals) * 100) : 0;
    const width = Math.max(8, (insight.value / maxValue) * 100);

    return (
        <div className="grid gap-2 sm:grid-cols-[10rem_minmax(0,1fr)_4.5rem] sm:items-center">
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: insight.color, boxShadow: `0 0 14px color-mix(in srgb, ${insight.color} 44%, transparent)` }} />
                    <p className="truncate text-xs font-black">{insight.name}</p>
                </div>
                <p className="mt-1 truncate text-[0.66rem] font-bold" style={{ color: "var(--color-muted)" }}>{insight.topGroup}</p>
            </div>

            <div className="h-3 overflow-hidden rounded-full border" style={{ borderColor: "var(--color-border)", backgroundColor: "color-mix(in srgb, var(--color-muted) 10%, var(--color-card))" }}>
                <div
                    className="h-full rounded-full"
                    style={{
                        width: `${width}%`,
                        background: `linear-gradient(90deg, ${insight.color}, color-mix(in srgb, ${insight.color} 64%, white))`,
                        boxShadow: `0 0 18px color-mix(in srgb, ${insight.color} 38%, transparent)`,
                    }}
                />
            </div>

            <div className="flex items-baseline justify-between gap-2 sm:justify-end">
                <span className="text-xs font-black" style={{ color: insight.color }}>{share}%</span>
                <span className="text-sm font-black">{insight.value}</span>
            </div>
        </div>
    );
}

function InsightDistributionCard({ insight }) {
    const topRanks = (insight.rankings || []).slice(0, 3);
    const maxRank = Math.max(...topRanks.map((rank) => Number(rank.count) || 0), Number(insight.value) || 1);

    return (
        <article
            className="rounded-[16px] border p-3"
            style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-card)",
                boxShadow: "none",
            }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: insight.color }} />
                        <p className="truncate text-xs font-black uppercase tracking-[0.08em]" style={{ color: "var(--color-muted)" }}>
                            {insight.title}
                        </p>
                    </div>
                    <p className="mt-1 truncate text-sm font-black">{insight.topGroup}</p>
                </div>
                <div className="text-right">
                    <p className="text-xl font-black leading-none" style={{ color: insight.color }}>{insight.value}</p>
                    <p className="mt-1 text-[0.58rem] font-black uppercase tracking-[0.12em]" style={{ color: "var(--color-muted)" }}>cases</p>
                </div>
            </div>

            <div className="mt-3 space-y-2">
                {topRanks.map((rank, index) => {
                    const value = Number(rank.count) || 0;
                    const width = Math.max(8, (value / maxRank) * 100);

                    return (
                        <div key={`${rank.group_type}-${rank.label}`} className="grid grid-cols-[minmax(0,1fr)_2rem] items-center gap-3">
                            <div className="min-w-0">
                                <div className="mb-1 flex items-center justify-between gap-2">
                                    <p className="truncate text-xs font-black">{rank.label}</p>
                                    <p className="shrink-0 text-[0.65rem] font-black" style={{ color: index === 0 ? insight.color : "var(--color-muted)" }}>
                                        {rank.group_type}
                                    </p>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: "color-mix(in srgb, var(--color-muted) 12%, var(--color-surface))" }}>
                                    <div
                                        className="h-full rounded-full"
                                        style={{
                                            width: `${width}%`,
                                            backgroundColor: insight.color,
                                            opacity: index === 0 ? 1 : 0.58,
                                        }}
                                    />
                                </div>
                                <p className="mt-1 text-[0.62rem] font-bold" style={{ color: "var(--color-muted)" }}>
                                    {rank.students} student{Number(rank.students) === 1 ? "" : "s"} measured
                                </p>
                            </div>
                            <p className="text-right text-xs font-black" style={{ color: insight.color }}>{value}</p>
                        </div>
                    );
                })}
            </div>
        </article>
    );
}

function InsightSummaryCard({ insight }) {
    const topRanks = (insight.rankings || []).slice(0, 3);
    const maxRank = Math.max(...topRanks.map((rank) => Number(rank.count) || 0), Number(insight.value) || 1);

    return (
        <article className="rounded-[18px] border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-xs font-black uppercase tracking-[0.1em]" style={{ color: "var(--color-muted)" }}>{insight.title}</p>
                    <p className="mt-1 text-sm font-black">{insight.topGroup}</p>
                </div>
                <span className="rounded-[12px] px-3 py-1 text-sm font-black" style={{ backgroundColor: "var(--color-card)", color: insight.color, boxShadow: `0 0 20px color-mix(in srgb, ${insight.color} 18%, transparent)` }}>
                    {insight.value}
                </span>
            </div>
            <div className="mt-4 space-y-3">
                {topRanks.map((rank) => (
                    <div key={`${rank.group_type}-${rank.label}`} className="flex items-center justify-between gap-3 rounded-[10px] border px-3 py-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
                        <div className="min-w-0">
                            <p className="truncate text-xs font-black">{rank.label}</p>
                            <p className="text-[0.66rem] font-bold" style={{ color: "var(--color-muted)" }}>{rank.group_type} · {rank.students} student{Number(rank.students) === 1 ? "" : "s"}</p>
                        </div>
                        <span className="shrink-0 text-xs font-black" style={{ color: insight.color }}>{rank.count}</span>
                    </div>
                ))}
            </div>
        </article>
    );
}

function InsightBarCard({ insight }) {
    const rankings = insight.rankings?.length ? insight.rankings : [{
        group_type: insight.group_type,
        label: insight.label,
        count: insight.count,
        students: insight.students,
    }];
    const max = Math.max(...rankings.map((row) => Number(row.count) || 0), 1);

    return (
        <article className="rounded-[16px] border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--color-muted)" }}>{insight.title}</p>
                    <p className="mt-2 text-sm font-black">{insight.group_type}: {insight.label}</p>
                    <p className="mt-1 text-xs font-bold leading-5" style={{ color: "var(--color-muted)" }}>{insight.detail}</p>
                </div>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] text-xl font-black" style={{ backgroundColor: "color-mix(in srgb, var(--color-error) 13%, var(--color-card))", color: "var(--color-error)" }}>
                    {insight.count}
                </span>
            </div>

            <div className="space-y-3">
                {rankings.map((row, index) => {
                    const value = Number(row.count) || 0;
                    const width = Math.max(5, (value / max) * 100);
                    const top = index === 0;

                    return (
                        <div key={`${row.group_type}-${row.label}`} className="rounded-[12px] border p-3" style={{ borderColor: top ? "color-mix(in srgb, var(--color-error) 42%, var(--color-border))" : "var(--color-border)", backgroundColor: top ? "color-mix(in srgb, var(--color-error) 8%, var(--color-card))" : "var(--color-card)" }}>
                            <div className="mb-2 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="truncate text-xs font-black">{row.label}</p>
                                    <p className="text-[0.66rem] font-bold" style={{ color: "var(--color-muted)" }}>{row.group_type} · {row.students} student{Number(row.students) === 1 ? "" : "s"}</p>
                                </div>
                                <span className="shrink-0 text-xs font-black" style={{ color: top ? "var(--color-error)" : "var(--color-text)" }}>{value}</span>
                            </div>
                            <div className="h-3 overflow-hidden rounded-full border" style={{ borderColor: "var(--color-border)", backgroundColor: "color-mix(in srgb, var(--color-primary) 8%, var(--color-card))" }}>
                                <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: top ? "var(--color-error)" : "var(--color-primary)" }} />
                            </div>
                            {top ? (
                                <p className="mt-2 text-[0.66rem] font-black uppercase tracking-[0.1em]" style={{ color: "var(--color-error)" }}>Highest count</p>
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </article>
    );
}

function DistributionPanel({ title, description, data }) {
    const chartData = normalizeDistributionData(data);
    const total = chartData.reduce((sum, item) => sum + (Number(item.count) || 0), 0);
    const topItem = [...chartData].sort((a, b) => (b.count || 0) - (a.count || 0))[0];
    const riskTotal = chartData
        .filter((item) => isRiskCategory(item.name))
        .reduce((sum, item) => sum + (Number(item.count) || 0), 0);
    const riskPercent = total ? Math.round((riskTotal / total) * 100) : 0;

    return (
        <ChartCard title={title} description={description}>
            <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[14px] border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                        <p className="text-[0.68rem] font-black uppercase tracking-[0.14em]" style={{ color: "var(--color-muted)" }}>Filtered Records</p>
                        <p className="mt-2 text-2xl font-black">{total}</p>
                    </div>
                    <div className="rounded-[14px] border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                        <p className="text-[0.68rem] font-black uppercase tracking-[0.14em]" style={{ color: "var(--color-muted)" }}>Most Common</p>
                        <p className="mt-2 truncate text-sm font-black">{topItem?.name || "No data"}</p>
                        <p className="mt-1 text-xs font-bold" style={{ color: "var(--color-muted)" }}>
                            {topItem ? `${topItem.count} record${topItem.count === 1 ? "" : "s"}` : "No matching records"}
                        </p>
                    </div>
                    <div className="rounded-[14px] border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                        <p className="text-[0.68rem] font-black uppercase tracking-[0.14em]" style={{ color: "var(--color-muted)" }}>Needs Review</p>
                        <p className="mt-2 text-2xl font-black" style={{ color: riskPercent ? "var(--color-error)" : "var(--color-success)" }}>{riskPercent}%</p>
                        <div className="mt-2 h-2 overflow-hidden rounded-full border" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                            <div className="h-full rounded-full" style={{ width: `${riskPercent}%`, backgroundColor: riskPercent ? "var(--color-error)" : "var(--color-success)" }} />
                        </div>
                    </div>
                </div>

                <div className="rounded-[16px] border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                    {chartData.length ? <VerticalBarSvg data={chartData} /> : <EmptyChart message="No distribution data for the selected filters." />}
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {chartData.map((item) => (
                            <div key={item.name} className="flex items-center justify-between gap-2 rounded-[12px] border px-3 py-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
                                <span className="inline-flex min-w-0 items-center gap-2 text-xs font-black" style={{ color: "var(--color-muted)" }}>
                                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: item.color }} />
                                    <span className="truncate">{item.name}</span>
                                </span>
                                <span className="shrink-0 text-xs font-black">{item.count} <span style={{ color: item.color }}>{item.percentage || 0}%</span></span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </ChartCard>
    );
}

function ComparisonPanel({ title, data }) {
    return (
        <ChartCard title={title} description="Average health measurements by academic group.">
            {data.length ? (
                <AcademicComparisonRows data={data} />
            ) : <EmptyChart message="No matching database values yet." />}
        </ChartCard>
    );
}

function AcademicComparisonChart({ data }) {
    const metrics = [
        ["average_bmi", "BMI", trendColorMap.average_bmi, "", "Average body mass index."],
        ["average_temperature", "Temperature", trendColorMap.average_temperature, "C", "Average body temperature."],
        ["average_heart_rate", "Heart Rate", trendColorMap.average_heart_rate, " bpm", "Average pulse reading."],
        ["average_spo2", "SpO2", trendColorMap.average_spo2, "%", "Average oxygen saturation."],
    ];
    const groups = [
        ["departments", "Department", data?.departments || []],
        ["grade_levels", "Grade", data?.grade_levels || []],
        ["programs", "Course", data?.programs || []],
    ];
    const rows = groups.flatMap(([source, groupType, items]) =>
        [...items]
            .sort((a, b) => String(a.label).localeCompare(String(b.label), undefined, { numeric: true }))
            .map((row) => ({
                source,
                groupType,
                label: row.label,
                name: `${groupType}: ${row.label}`,
                students: Number(row.students) || 0,
                average_bmi: Number(row.average_bmi) || 0,
                average_temperature: Number(row.average_temperature) || 0,
                average_heart_rate: Number(row.average_heart_rate) || 0,
                average_spo2: Number(row.average_spo2) || 0,
            })),
    );

    const reviewCount = rows.filter((row) =>
        row.average_bmi >= 30 ||
        row.average_temperature >= 37.5 ||
        row.average_spo2 < 95 ||
        row.average_heart_rate > 100 ||
        row.average_heart_rate < 60,
    ).length;
    const highestBmi = [...rows].sort((a, b) => b.average_bmi - a.average_bmi)[0];

    return (
        <section className={`${cardClassName} min-w-0 p-5`} style={cardStyle}>
            {/* ── Title ── */}
            <div className="mb-4">
                <h3 className="text-base font-black">Academic average comparison</h3>
                <p className="mt-1 text-sm font-bold leading-5" style={{ color: "var(--color-muted)" }}>
                    Compares average BMI, temperature, heart rate, and SpO2 across grade levels, strands, and college courses.
                </p>
            </div>

            {/* ── Stats row ── */}
            <div className="mb-4 grid grid-cols-3 gap-2">
                <div className="rounded-[12px] border p-2.5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                    <p className="text-[0.62rem] font-black uppercase tracking-[0.12em]" style={{ color: "var(--color-muted)" }}>Groups Compared</p>
                    <p className="mt-1.5 text-xl font-black">{rows.length}</p>
                </div>
                <div className="rounded-[12px] border p-2.5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                    <p className="text-[0.62rem] font-black uppercase tracking-[0.12em]" style={{ color: "var(--color-muted)" }}>Needs Review</p>
                    <p className="mt-1.5 text-xl font-black" style={{ color: reviewCount ? "var(--color-error)" : "var(--clinical-normal)" }}>
                        {reviewCount}
                    </p>
                </div>
                <div className="rounded-[12px] border p-2.5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                    <p className="text-[0.62rem] font-black uppercase tracking-[0.12em]" style={{ color: "var(--color-muted)" }}>Highest BMI</p>
                    <p className="mt-1.5 truncate text-sm font-black">{highestBmi?.name || "No data"}</p>
                </div>
            </div>

            {rows.length ? (
                <div className="rounded-[16px] border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                    <div className="h-[28rem] w-full">
                        <ResponsiveContainer debounce={50} width="100%" height="100%">
                            <AreaChart data={rows} margin={{ top: 18, right: 20, left: -16, bottom: 58 }}>
                                <defs>
                                    {metrics.map(([key, , color]) => (
                                        <linearGradient key={key} id={`academic-average-${key}`} x1="0" x2="0" y1="0" y2="1">
                                            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
                                            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
                                        </linearGradient>
                                    ))}
                                </defs>
                                <XAxis
                                    dataKey="name"
                                    tickLine={false}
                                    axisLine={false}
                                    interval={0}
                                    minTickGap={0}
                                    tick={{ fill: "var(--color-muted)", fontSize: 10, fontWeight: 800 }}
                                    tickFormatter={(value) => compactLabel(String(value).replace(": ", " "), 11)}
                                    angle={-28}
                                    textAnchor="end"
                                    height={74}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    width={38}
                                    tick={{ fill: "var(--color-muted)", fontSize: 10, fontWeight: 800 }}
                                />
                                <Tooltip content={<AcademicComparisonTooltip metrics={metrics} />} />
                                {metrics.map(([key, label, color]) => (
                                    <Area
                                        key={key}
                                        type="monotone"
                                        dataKey={key}
                                        name={label}
                                        stroke={color}
                                        strokeWidth={2.6}
                                        fill={`url(#academic-average-${key})`}
                                        isAnimationActive={false}
                                        dot={{ r: 3, strokeWidth: 2, fill: "var(--color-card)", stroke: color }}
                                        activeDot={{ r: 5, strokeWidth: 2, fill: color, stroke: "var(--color-card)" }}
                                    />
                                ))}
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        {metrics.map(([key, label, color, , description]) => (
                            <div key={key} className="flex items-start gap-2 rounded-[12px] border px-3 py-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
                                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                                <div className="min-w-0">
                                    <p className="text-xs font-black" style={{ color }}>{label}</p>
                                    <p className="text-[0.68rem] font-bold leading-4" style={{ color: "var(--color-muted)" }}>{description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : <EmptyChart message="No matching academic comparison data yet." />}
        </section>
    );
}

function AcademicComparisonTooltip({ active, payload, label, metrics }) {
    if (!active || !payload?.length) return null;

    const row = payload[0]?.payload || {};
    const needsReview = row.average_bmi >= 30 || row.average_temperature >= 37.5 || row.average_spo2 < 95 || row.average_heart_rate > 100 || row.average_heart_rate < 60;

    return (
        <div className="max-w-[18rem] rounded-[14px] border p-3 shadow-xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-text)" }}>
            <p className="text-sm font-black">{label}</p>
            <p className="mt-1 text-xs font-bold" style={{ color: "var(--color-muted)" }}>
                {row.students} student{Number(row.students) === 1 ? "" : "s"} measured · {needsReview ? "Needs review" : "Normal range"}
            </p>
            <div className="mt-3 space-y-2">
                {payload.map((item) => {
                    const meta = metrics.find(([key]) => key === item.dataKey);
                    const suffix = meta?.[3] || "";
                    const description = meta?.[4] || "Filtered group average.";

                    return (
                        <div key={item.dataKey} className="flex items-start gap-2">
                            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs font-black">{item.name}</p>
                                    <p className="text-xs font-black" style={{ color: item.color }}>{formatTrendValue(item.value, suffix)}</p>
                                </div>
                                <p className="text-[0.68rem] font-bold leading-4" style={{ color: "var(--color-muted)" }}>{description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function AcademicComparisonRows({ data }) {
    const sortedRows = [...data].sort((a, b) => String(a.label).localeCompare(String(b.label), undefined, { numeric: true }));
    const maxBmi = Math.max(...sortedRows.map((row) => Number(row.average_bmi) || 0), 1);

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs font-bold sm:grid-cols-4" style={{ color: "var(--color-muted)" }}>
                <LegendDot color="var(--health-bmi)"         label="BMI" />
                <LegendDot color="var(--health-temperature)" label="Temperature" />
                <LegendDot color="var(--health-heart-rate)"  label="Heart rate" />
                <LegendDot color="var(--health-spo2)"        label="SpO2" />
            </div>

            <div className="space-y-3">
                {sortedRows.map((row) => {
                    const bmi = Number(row.average_bmi) || 0;
                    const barWidth = Math.max(4, (bmi / maxBmi) * 100);
                    const review = bmi >= 30 || Number(row.average_temperature) >= 37.5 || Number(row.average_spo2) < 95 || Number(row.average_heart_rate) > 100 || Number(row.average_heart_rate) < 60;

                    return (
                        <article key={row.label} className="rounded-[16px] border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h4 className="text-sm font-black">{row.label}</h4>
                                        {review ? (
                                            <span className="rounded-full px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.1em]" style={{ backgroundColor: "color-mix(in srgb, var(--color-error) 12%, transparent)", color: "var(--color-error)" }}>
                                                Needs Review
                                            </span>
                                        ) : (
                                            <span className="rounded-full px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.1em]" style={{ backgroundColor: "color-mix(in srgb, var(--color-success) 12%, transparent)", color: "var(--color-success)" }}>
                                                Normal
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-xs font-bold" style={{ color: "var(--color-muted)" }}>{row.students} student{Number(row.students) === 1 ? "" : "s"} measured</p>
                                </div>
                                <p className="text-right text-xl font-black">
                                    {bmi.toFixed(1)}
                                    <span className="ml-1 text-xs font-bold" style={{ color: "var(--color-muted)" }}>avg BMI</span>
                                </p>
                            </div>

                            <div className="mt-4">
                                <div className="h-3 overflow-hidden rounded-full border" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                                    <div className="h-full rounded-full" style={{ width: `${barWidth}%`, backgroundColor: review ? "var(--color-error)" : "var(--color-primary)" }} />
                                </div>
                                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                    <MetricChip color="var(--health-temperature)" label="Temp"  value={`${Number(row.average_temperature || 0).toFixed(1)}C`} />
                                    <MetricChip color="var(--health-heart-rate)"  label="HR"    value={`${Math.round(Number(row.average_heart_rate) || 0)} bpm`} />
                                    <MetricChip color="var(--health-spo2)"         label="SpO2" value={`${Number(row.average_spo2 || 0).toFixed(1)}%`} />
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}

function MetricChip({ color, label, value }) {
    return (
        <div className="flex items-center justify-between gap-2 rounded-[12px] border px-3 py-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
            <span className="inline-flex items-center gap-2 text-xs font-black" style={{ color: "var(--color-muted)" }}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                {label}
            </span>
            <span className="text-xs font-black">{value}</span>
        </div>
    );
}

function TrendPanel({ data, period, onPeriodChange }) {
    const metrics = [
        ["average_bmi", "BMI", trendColorMap.average_bmi, ""],
        ["average_heart_rate", "Heart Rate", trendColorMap.average_heart_rate, " bpm"],
        ["average_spo2", "SpO2", trendColorMap.average_spo2, "%"],
        ["average_temperature", "Temperature", trendColorMap.average_temperature, "C"],
    ];

    return (
        <ChartCard
            title="Health trend analysis"
            description="Trend lines use only filtered measurement records."
            action={<PeriodTabs value={period} onChange={onPeriodChange} />}
        >
            {data.length ? (
                <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {metrics.map(([key, label, color]) => (
                            <div key={key} className="rounded-[14px] border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                                <p className="text-xs font-black uppercase tracking-[0.12em]" style={{ color }}>{label}</p>
                                <p className="mt-2 text-2xl font-black">{latestValue(data, key)}</p>
                                <p className="mt-1 text-[0.68rem] font-bold leading-4" style={{ color: "var(--color-muted)" }}>
                                    Latest filtered average, not highest
                                </p>
                            </div>
                        ))}
                    </div>
                    {data.length < 2 ? (
                        <EmptyChart
                            title="More records are needed"
                            message="At least two measurement periods are needed to display a meaningful trend line."
                        />
                    ) : (
                        <div className="rounded-[16px] border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                            <TrendLineChart data={data} metrics={metrics} />
                        </div>
                    )}
                </div>
            ) : <EmptyChart message="No trend records match the selected filters." />}
        </ChartCard>
    );
}

function TrendLineChart({ data, metrics }) {
    return (
        <div>
            <div className="h-[22rem] w-full">
                <ResponsiveContainer debounce={50} width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 18, right: 20, left: -16, bottom: 12 }}>
                        <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: "var(--color-muted)", fontSize: 11, fontWeight: 800 }}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            width={38}
                            tick={{ fill: "var(--color-muted)", fontSize: 10, fontWeight: 800 }}
                        />
                        <Tooltip content={<TrendTooltip metrics={metrics} />} />
                        {metrics.map(([key, label, color]) => (
                            <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                name={label}
                                stroke={color}
                                strokeWidth={3}
                                isAnimationActive={false}
                                dot={{ r: 3, strokeWidth: 2, fill: "var(--color-card)", stroke: color }}
                                activeDot={{ r: 5, strokeWidth: 2, fill: color, stroke: "var(--color-card)" }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
                {metrics.map(([key, label, color]) => (
                    <span key={key} className="inline-flex items-center gap-2 text-xs font-black" style={{ color: "var(--color-muted)" }}>
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                        {label}
                    </span>
                ))}
            </div>
        </div>
    );
}

function TrendTooltip({ active, payload, label, metrics }) {
    if (!active || !payload?.length) return null;

    return (
        <div className="min-w-48 rounded-[14px] border p-3 shadow-xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-text)" }}>
            <p className="text-sm font-black">{label}</p>
            <p className="mt-1 text-xs font-bold" style={{ color: "var(--color-muted)" }}>Filtered average measurements</p>
            <div className="mt-3 space-y-2">
                {payload.map((item) => {
                    const meta = metrics.find(([key]) => key === item.dataKey);
                    const suffix = meta?.[3] || "";

                    return (
                        <div key={item.dataKey} className="flex items-center justify-between gap-4">
                            <span className="inline-flex items-center gap-2 text-xs font-black">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                {item.name}
                            </span>
                            <span className="text-xs font-black" style={{ color: item.color }}>
                                {formatTrendValue(item.value, suffix)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function VerticalBarSvg({ data }) {
    const width = 640;
    const height = 280;
    const paddingX = 44;
    const paddingTop = 34;
    const paddingBottom = 50;
    const max = Math.max(...data.map((item) => Number(item.count) || 0), 1);
    const chartWidth = width - paddingX * 2;
    const chartHeight = height - paddingTop - paddingBottom;
    const slot = chartWidth / Math.max(data.length, 1);
    const barWidth = Math.min(46, slot * 0.52);

    return (
        <div className="w-full">
            <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Distribution bar chart" preserveAspectRatio="xMidYMid meet">
                <defs>
                    {data.map((item) => (
                        <linearGradient key={item.name} id={`distribution-${slug(item.name)}`} x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor={item.color} stopOpacity="0.92" />
                            <stop offset="100%" stopColor={item.color} stopOpacity="0.56" />
                        </linearGradient>
                    ))}
                </defs>
                {[0, 1, 2, 3].map((line) => {
                    const y = paddingTop + line * (chartHeight / 3);
                    const value = Math.round(max - (line * max) / 3);
                    return (
                        <g key={line}>
                            <text x={paddingX - 10} y={y + 4} textAnchor="end" fontSize="10" fontWeight="800" fill="var(--color-muted)">
                                {value}
                            </text>
                        </g>
                    );
                })}
                {data.map((item, index) => {
                    const value = Number(item.count) || 0;
                    const barHeight = (value / max) * chartHeight;
                    const x = paddingX + index * slot + (slot - barWidth) / 2;
                    const y = height - paddingBottom - barHeight;
                    const label = compactLabel(item.name, 10);

                    return (
                        <g key={item.name}>
                            <rect x={x} y={paddingTop} width={barWidth} height={chartHeight} rx="10" fill="color-mix(in srgb, var(--color-primary) 8%, var(--color-card))" stroke="var(--color-border)" strokeWidth="1" />
                            <rect x={x} y={y} width={barWidth} height={barHeight} rx="10" fill={`url(#distribution-${slug(item.name)})`} />
                            <text x={x + barWidth / 2} y={Math.max(14, y - 8)} textAnchor="middle" fontSize="11" fontWeight="900" fill="var(--color-text)">
                                {value}
                            </text>
                            <text x={x + barWidth / 2} y={height - 22} textAnchor="middle" fontSize="11" fontWeight="900" fill="var(--color-muted)">
                                {label}
                            </text>
                            <text x={x + barWidth / 2} y={height - 8} textAnchor="middle" fontSize="10" fontWeight="900" fill={item.color}>
                                {item.percentage || 0}%
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

function HorizontalGroupSvg({ data }) {
    const width = 620;
    const rowHeight = 72;
    const padding = 30;
    const labelWidth = 94;
    const height = Math.max(210, padding * 2 + data.length * rowHeight);
    const metrics = [
        ["average_bmi",         "BMI",  "var(--health-bmi)",         1],
        ["average_temperature", "Temp", "var(--health-temperature)", 1],
        ["average_heart_rate",  "HR",   "var(--health-heart-rate)",  0],
        ["average_spo2",        "SpO2", "var(--health-spo2)",        1],
    ];
    const max = Math.max(...data.flatMap((row) => metrics.map(([key]) => Number(row[key]) || 0)), 1);
    const barArea = width - padding * 2 - labelWidth;

    return (
        <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[560px]" role="img" aria-label="Academic comparison grouped bar chart">
                {data.map((row, rowIndex) => {
                    const y = padding + rowIndex * rowHeight;

                    return (
                        <g key={row.label}>
                            <text x={padding} y={y + 20} fontSize="12" fontWeight="900" fill="var(--color-text)">
                                {compactLabel(row.label, 12)}
                            </text>
                            <text x={padding} y={y + 38} fontSize="10" fontWeight="800" fill="var(--color-muted)">
                                {row.students} students
                            </text>
                            {metrics.map(([key, label, color, decimals], metricIndex) => {
                                const value = Number(row[key]) || 0;
                                const barWidth = (value / max) * barArea;
                                const barY = y + metricIndex * 13;

                                return (
                                    <g key={key}>
                                        <rect x={padding + labelWidth} y={barY} width={barArea} height="8" rx="4" fill="color-mix(in srgb, var(--color-primary) 8%, var(--color-card))" />
                                        <rect x={padding + labelWidth} y={barY} width={barWidth} height="8" rx="4" fill={color} />
                                        <text x={padding + labelWidth + barWidth + 6} y={barY + 8} fontSize="9" fontWeight="800" fill="var(--color-muted)">
                                            {label} {value.toFixed(decimals)}
                                        </text>
                                    </g>
                                );
                            })}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

function LegendDot({ color, label }) {
    return (
        <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
            {label}
        </span>
    );
}

function normalizeDistributionData(data) {
    const rows = (data || [])
        .filter((item) => item && item.name)
        .map((item, index) => ({
            ...item,
            count: Number(item.count) || 0,
            color: distributionColor(item.name, index),
        }))
        .filter((item) => item.count > 0);

    const total = rows.reduce((sum, item) => sum + item.count, 0);

    return rows.map((item) => ({
        ...item,
        percentage: total ? Math.round((item.count / total) * 100) : 0,
    }));
}

function distributionColor(name, index = 0) {
    const normalized = String(name || "").toLowerCase();
    const match = Object.entries(clinicalColorMap).find(([key]) => normalized.includes(key));

    return match?.[1] || chartColors[index % chartColors.length];
}

function isRiskCategory(name) {
    const normalized = String(name || "").toLowerCase();

    return ["low", "high", "elevated", "overweight", "obese", "underweight", "alert", "watch"].some((key) => normalized.includes(key))
        && !normalized.includes("normal")
        && !normalized.includes("healthy");
}

function slug(value) {
    return String(value || "item").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function AcademicRiskChart({ data }) {
    const columns = [
        ["total_students", "Students"],
        ["underweight", "Under"],
        ["overweight", "Over"],
        ["obese", "Obese"],
        ["abnormal_hr", "Abnormal HR"],
        ["low_spo2", "Low SpO2"],
        ["high_spo2", "High SpO2"],
        ["low_temperature", "Low Temperature"],
        ["high_temperature", "High Temperature"],
    ];
    const riskColumns = columns.filter(([key]) => key !== "total_students");
    const riskSeries = riskColumns.map(([key, label]) => ({
        key,
        label,
        color: riskColor(key),
        description: riskDescription(key),
    }));
    const groups = [
        ["departments", "Department", data?.departments || []],
        ["programs", "Course", data?.programs || []],
        ["grade_levels", "Grade", data?.grade_levels || []],
    ];
    const rows = groups.flatMap(([groupKey, groupLabel, groupRows]) =>
        groupRows.map((row) => ({
            source: groupKey,
            groupType: groupLabel,
            label: row.label,
            name: `${groupLabel}: ${row.label}`,
            shortName: row.label,
            students: Number(row.total_students) || 0,
            total_flags: riskColumns.reduce((sum, [key]) => sum + riskValue(row, key), 0),
            ...Object.fromEntries(riskColumns.map(([key]) => [key, riskValue(row, key)])),
        })),
    );
    const maxRisk = Math.max(
        1,
        ...rows.flatMap((row) => riskColumns.map(([key]) => riskValue(row, key))),
    );
    const totalRisk = rows.reduce((sum, row) => sum + riskColumns.reduce((inner, [key]) => inner + riskValue(row, key), 0), 0);
    const highestGroup = [...rows].sort((a, b) => b.total_flags - a.total_flags)[0];

    return (
        <section className={`${cardClassName} min-w-0 p-5`} style={cardStyle}>
            {/* ── Title ── */}
            <div className="mb-4">
                <h3 className="text-base font-black">Academic risk breakdown by group</h3>
                <p className="mt-1 text-sm font-bold leading-5" style={{ color: "var(--color-muted)" }}>
                    Counts of obesity, low SpO2, abnormal heart rate, and temperature flags inside each course, grade level, and strand.
                </p>
            </div>

            {/* ── Stats row ── */}
            <div className="mb-4 grid grid-cols-2 gap-2">
                <div className="rounded-[12px] border p-2.5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                    <p className="text-[0.62rem] font-black uppercase tracking-[0.12em]" style={{ color: "var(--color-muted)" }}>Total Risk Flags</p>
                    <p className="mt-1.5 text-xl font-black" style={{ color: totalRisk ? "var(--color-error)" : "var(--clinical-normal)" }}>
                        {totalRisk}
                    </p>
                </div>
                <div className="rounded-[12px] border p-2.5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                    <p className="text-[0.62rem] font-black uppercase tracking-[0.12em]" style={{ color: "var(--color-muted)" }}>Highest Group</p>
                    <p className="mt-1.5 truncate text-sm font-black">{highestGroup?.name || "No data"}</p>
                </div>
            </div>

            {rows.length ? (
                <div className="space-y-4">
                    <div className="rounded-[16px] border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                        <div className="h-[26rem] w-full">
                            <ResponsiveContainer debounce={50} width="100%" height="100%">
                                <LineChart data={rows} margin={{ top: 18, right: 18, left: -18, bottom: 52 }}>
                                    <XAxis
                                        dataKey="name"
                                        tickLine={false}
                                        axisLine={false}
                                        interval={0}
                                        minTickGap={0}
                                        tick={{ fill: "var(--color-muted)", fontSize: 10, fontWeight: 800 }}
                                        tickFormatter={(value) => compactLabel(String(value).replace(": ", " "), 11)}
                                        angle={-28}
                                        textAnchor="end"
                                        height={70}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tickLine={false}
                                        axisLine={false}
                                        width={34}
                                        tick={{ fill: "var(--color-muted)", fontSize: 10, fontWeight: 800 }}
                                        domain={[0, Math.max(maxRisk, 2)]}
                                    />
                                    <Tooltip content={<RiskBreakdownTooltip series={riskSeries} />} />
                                    {riskSeries.map((series) => (
                                        <Line
                                            key={series.key}
                                            type="monotone"
                                            dataKey={series.key}
                                            name={series.label}
                                            stroke={series.color}
                                            strokeWidth={2.8}
                                            isAnimationActive={false}
                                            dot={{ r: 3, strokeWidth: 2, fill: "var(--color-card)", stroke: series.color }}
                                            activeDot={{ r: 5, strokeWidth: 2, fill: series.color, stroke: "var(--color-card)" }}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                            {riskSeries.map((series) => (
                                <div key={series.key} className="flex items-start gap-2 rounded-[12px] border px-3 py-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
                                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: series.color }} />
                                    <div className="min-w-0">
                                        <p className="text-xs font-black" style={{ color: series.color }}>{series.label}</p>
                                        <p className="text-[0.68rem] font-bold leading-4" style={{ color: "var(--color-muted)" }}>{series.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : <EmptyChart message="No database values for this academic group yet." />}
        </section>
    );
}

function RiskBreakdownTooltip({ active, payload, label, series }) {
    if (!active || !payload?.length) return null;

    const row = payload[0]?.payload || {};
    const visiblePayload = payload
        .filter((item) => Number(item.value) > 0)
        .sort((a, b) => Number(b.value) - Number(a.value));

    return (
        <div className="max-w-[17rem] rounded-[14px] border p-3 shadow-xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-text)" }}>
            <p className="text-sm font-black">{label}</p>
            <p className="mt-1 text-xs font-bold" style={{ color: "var(--color-muted)" }}>
                {row.students} student{Number(row.students) === 1 ? "" : "s"} measured · {row.total_flags} total risk flag{Number(row.total_flags) === 1 ? "" : "s"}
            </p>
            <div className="mt-3 space-y-2">
                {(visiblePayload.length ? visiblePayload : payload.slice(0, 3)).map((item) => {
                    const meta = series.find((entry) => entry.key === item.dataKey);

                    return (
                        <div key={item.dataKey} className="flex items-start gap-2">
                            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs font-black">{meta?.label || item.name}</p>
                                    <p className="text-xs font-black" style={{ color: item.color }}>{item.value}</p>
                                </div>
                                <p className="text-[0.68rem] font-bold leading-4" style={{ color: "var(--color-muted)" }}>
                                    {meta?.description || "Filtered risk count"}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function RiskHeatCell({ label, value, max, tone }) {
    const intensity = value > 0 ? Math.max(14, Math.round((value / max) * 42)) : 0;
    const color = riskToneColor(tone);

    return (
        <div
            className="rounded-[12px] border px-3 py-3 text-center transition hk-admin-nav-hover"
            style={{
                borderColor: value ? `color-mix(in srgb, ${color} 42%, var(--color-border))` : "var(--color-border)",
                backgroundColor: value ? `color-mix(in srgb, ${color} ${intensity}%, var(--color-card))` : "var(--color-card)",
            }}
            title={`${label}: ${value}`}
        >
            <p className="text-lg font-black" style={{ color: value ? color : "var(--color-muted)" }}>{value}</p>
            <p className="mt-1 text-[0.66rem] font-black uppercase tracking-[0.08em]" style={{ color: "var(--color-muted)" }}>{label}</p>
        </div>
    );
}

function riskValue(row, key) {
    if (key === "abnormal_hr") {
        if (row.abnormal_hr !== undefined) return Number(row.abnormal_hr) || 0;

        return (Number(row.low_heart_rate) || 0) + (Number(row.high_heart_rate) || 0);
    }

    return Number(row[key]) || 0;
}

function riskTone(key) {
    if (["underweight", "low_spo2"].includes(key)) return "info";
    if (["overweight", "abnormal_hr", "low_temperature", "elevated_temperature"].includes(key)) return "warning";
    return "error";
}

function riskToneColor(tone) {
    return tone === "info" ? "var(--color-info)" : tone === "warning" ? "var(--color-warning)" : "var(--color-error)";
}

function riskColor(key) {
    return riskColorMap[key] || riskToneColor(riskTone(key));
}

function insightColor(key, index = 0) {
    const colors = {
        high_temperature: riskColorMap.high_temperature,
        obese: riskColorMap.obese,
        low_spo2: riskColorMap.low_spo2,
        high_spo2: riskColorMap.high_spo2,
        high_heart_rate: riskColorMap.abnormal_hr,
        low_temperature: riskColorMap.low_temperature,
        elevated_temperature: "#f59e0b",
        underweight: riskColorMap.underweight,
    };

    return colors[key] || chartColors[index % chartColors.length];
}

function statusRiskColor(key, index = 0) {
    const colors = {
        underweight: riskColorMap.underweight,
        overweight: riskColorMap.overweight,
        obese: riskColorMap.obese,
        low_heart_rate: "#8b5cf6",
        high_heart_rate: riskColorMap.abnormal_hr,
        low_spo2: riskColorMap.low_spo2,
        high_spo2: riskColorMap.high_spo2,
        low_temperature: riskColorMap.low_temperature,
        high_temperature: riskColorMap.high_temperature,
    };

    return colors[key] || chartColors[index % chartColors.length];
}

function riskSummaryDescription(key) {
    const descriptions = {
        underweight: "BMI below healthy range",
        overweight: "BMI above normal range",
        obese: "BMI obesity classification",
        low_heart_rate: "Pulse below normal range",
        high_heart_rate: "Pulse above normal range",
        low_spo2: "Oxygen saturation below normal",
        high_spo2: "Oxygen saturation above valid range",
        low_temperature: "Body temperature below normal range",
        high_temperature: "Temperature at high-temperature threshold",
    };

    return descriptions[key] || "Clinical follow-up case";
}

function riskDescription(key) {
    const descriptions = {
        underweight: "BMI below the healthy range.",
        overweight: "BMI above the normal range.",
        obese: "BMI classified as obese.",
        abnormal_hr: "Low or high pulse readings.",
        low_spo2: "Oxygen saturation below normal.",
        high_spo2: "Oxygen saturation above valid range.",
        low_temperature: "Body temperature below normal range.",
        high_temperature: "Temperature at high-temperature threshold.",
    };

    return descriptions[key] || "Filtered clinical risk count.";
}

function FollowUpTable({ rows, search, onSearch }) {
    const [page, setPage] = useState(1);
    const pageSize = 15;
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const startIndex = (currentPage - 1) * pageSize;
    const displayedRows = rows.slice(startIndex, startIndex + pageSize);

    useEffect(() => {
        setPage(1);
    }, [search]);

    useEffect(() => {
        setPage((current) => Math.min(current, totalPages));
    }, [totalPages]);

    return (
        <section className={`${cardClassName} p-5`} style={cardStyle}>
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <SectionHeader title="Students requiring follow-up" description="Students with active health alerts requiring clinic follow-up. Students are automatically removed once all related alerts have been resolved." />
                <label className="flex h-11 min-w-0 items-center gap-3 rounded-[12px] border px-3 lg:w-80" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                    <Search size={16} style={{ color: "var(--color-muted)" }} />
                    <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search student or status..." className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none" />
                </label>
            </div>
            <div className="overflow-auto rounded-[12px] border" style={{ borderColor: "var(--color-border)" }}>
                <table className="w-full min-w-[980px] text-left text-xs">
                    <thead style={{ backgroundColor: "var(--color-surface)", color: "var(--color-muted)" }}>
                        <tr>
                            {["Student ID", "Student Name", "Academic Information", "BMI", "Heart Rate", "SpO2", "Temperature", "Date Measured"].map((column) => (
                                <th key={column} className="border-b px-3 py-3 font-black" style={{ borderColor: "var(--color-border)" }}>{column}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {displayedRows.length ? displayedRows.map((row, index) => (
                            <tr key={`${row.student_id}-${row.date_measured}-${startIndex + index}`} className="border-b" style={{ borderColor: "var(--color-border)" }}>
                                <td className="px-3 py-3 font-black">{row.student_id}</td>
                                <td className="px-3 py-3 font-bold">{row.name}</td>
                                <td className="px-3 py-3 font-bold" style={{ color: "var(--color-muted)" }}>{row.academic_information}</td>
                                <td className="px-3 py-3"><StatusText value={row.bmi_status} /></td>
                                <td className="px-3 py-3"><StatusText value={row.heart_rate_status} /></td>
                                <td className="px-3 py-3"><StatusText value={row.spo2_status} /></td>
                                <td className="px-3 py-3"><StatusText value={row.temperature_status} /></td>
                                <td className="px-3 py-3 font-bold" style={{ color: "var(--color-muted)" }}>{row.date_measured}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={8} className="px-3 py-10 text-center text-sm font-bold" style={{ color: "var(--color-muted)" }}>No students require follow-up for the selected filters.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-bold" style={{ color: "var(--color-muted)" }}>
                    Showing {rows.length ? startIndex + 1 : 0}-{Math.min(startIndex + pageSize, rows.length)} of {rows.length} follow-up records
                </p>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                        disabled={currentPage === 1}
                        className="h-10 rounded-[12px] border px-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-45"
                        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text)" }}
                    >
                        Previous
                    </button>
                    <span className="rounded-[12px] border px-3 py-2 text-xs font-black" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-muted)" }}>
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        type="button"
                        onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                        disabled={currentPage === totalPages}
                        className="h-10 rounded-[12px] border px-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-45"
                        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text)" }}
                    >
                        Next
                    </button>
                </div>
            </div>
        </section>
    );
}

function ChartCard({ title, description, action = null, children }) {
    return (
        <article className={`${cardClassName} h-full p-5 sm:p-6`} style={cardStyle}>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h3 className="text-base font-black">{title}</h3>
                    <p className="mt-1 text-sm font-bold leading-5" style={{ color: "var(--color-muted)" }}>{description}</p>
                </div>
                {action ? (
                    <div className="shrink-0">{action}</div>
                ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px]" style={{ backgroundColor: "var(--color-surface)", color: "var(--color-primary)" }}>
                        <Activity size={17} />
                    </span>
                )}
            </div>
            {children}
        </article>
    );
}

function EmptyChart({ message, title = "No matching records found" }) {
    return (
        <div className="flex min-h-44 flex-col items-center justify-center rounded-[12px] border p-6 text-center" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)", backgroundColor: "var(--color-surface)" }}>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[12px]" style={{ backgroundColor: "var(--color-card)", color: "var(--color-primary)" }}>
                <Search size={18} />
            </div>
            <p className="text-sm font-black" style={{ color: "var(--color-text)" }}>{title}</p>
            <p className="mt-1 max-w-sm text-xs font-bold leading-5">{message}</p>
        </div>
    );
}

function PeriodTabs({ value, onChange }) {
    return (
        <div className="flex rounded-[12px] border p-1" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            {["weekly", "monthly", "yearly"].map((period) => (
                <button
                    key={period}
                    type="button"
                    onClick={() => onChange(period)}
                    className="rounded-[10px] px-3 py-2 text-xs font-black capitalize transition"
                    style={{ backgroundColor: value === period ? "var(--color-primary)" : "transparent", color: value === period ? "#fff" : "var(--color-muted)" }}
                >
                    {period}
                </button>
            ))}
        </div>
    );
}

function StatusText({ value }) {
    const normal = value === "Normal";
    const noData = value === "No Data";
    const warning = ["Low Temperature", "Elevated", "Low", "Overweight", "Underweight"].includes(value);
    const toneColor = normal
        ? "var(--color-success)"
        : noData
            ? "var(--color-muted)"
            : warning
                ? "var(--color-warning)"
                : "var(--color-error)";

    return (
        <span
            className="inline-flex rounded-full border px-2.5 py-1 text-[0.68rem] font-black"
            style={{
                borderColor: "var(--color-border)",
                backgroundColor: noData ? "var(--color-surface)" : `color-mix(in srgb, ${toneColor} 12%, transparent)`,
                color: toneColor,
            }}
        >
            {value}
        </span>
    );
}

function latestValue(data, key) {
    return data.at(-1)?.[key] ?? 0;
}

function formatTrendValue(value, suffix = "") {
    const number = Number(value);

    if (!Number.isFinite(number)) return `0${suffix}`;

    const formatted = Number.isInteger(number) ? String(number) : number.toFixed(1);

    return `${formatted}${suffix}`;
}

function compactLabel(value, max = 10) {
    const label = String(value || "");

    return label.length > max ? `${label.slice(0, max - 1)}...` : label;
}

function formatLabel(value) {
    return String(value || "")
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isSeniorHighGrade(value) {
    return ["Grade 11", "Grade 12"].includes(String(value || "").trim());
}

// ─────────────────────────────────────────────────
//  ALERT ANALYTICS SECTION
// ─────────────────────────────────────────────────

function AlertAnalyticsSection({ data, onViewAlert }) {
    const [selectedType, setSelectedType] = useState(null);
    const distribution  = data?.distribution  || [];
    const drillDown     = data?.drill_down     || {};
    const overview      = data?.overview       || { total: 0, resolved: 0, pending: 0, resolution_rate: 0 };
    const recentResolved = data?.recent_resolved || [];
    const drillDownRows = selectedType ? (drillDown[selectedType] || []) : [];

    const handleTypeClick = (key) => setSelectedType((current) => (current === key ? null : key));

    const drillDownRef = useRef(null);

    useEffect(() => {
        if (selectedType && drillDownRef.current) {
            setTimeout(() => {
                drillDownRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 50);
        }
    }, [selectedType]);

    return (
        <div className="space-y-5">
            {/* ── Section Header ── */}
            <div className={`${cardClassName} overflow-hidden p-5 sm:p-6`} style={cardStyle}>
                <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: "var(--color-primary)" }}>Alert Analytics</p>
                <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-black sm:text-4xl">Health Intervention Analytics</h2>
                        <p className="mt-3 text-sm font-bold leading-6 sm:text-base" style={{ color: "var(--color-muted)" }}>
                            Tracks the complete lifecycle of health alerts — from kiosk detection to clinic resolution. Click any alert type bar to drill down into individual student cases.
                        </p>
                    </div>
                    <div className="inline-flex w-fit items-center gap-2 rounded-[14px] border px-3 py-2 text-xs font-black" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-muted)" }}>
                        <Bell size={15} style={{ color: "var(--color-primary)" }} />
                        Respects active filters
                    </div>
                </div>
            </div>

            {/* ── Overview Cards ── */}
            <AlertOverviewCards overview={overview} />

            {/* ── Distribution Chart + Type KPI side-by-side ── */}
            <div className="grid gap-4 2xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <AlertDistributionChart data={distribution} selectedType={selectedType} onTypeClick={handleTypeClick} />
                <AlertTypeKPICards data={distribution} selectedType={selectedType} onTypeClick={handleTypeClick} />
            </div>

            {/* ── Drill-Down Table (shown when type is selected) ── */}
            {selectedType && (
                <div ref={drillDownRef}>
                    <AlertDrillDownTable
                        rows={drillDownRows}
                        typeLabel={alertTypeConfig[selectedType]?.label || selectedType}
                        onClose={() => setSelectedType(null)}
                        onViewAlert={onViewAlert}
                    />
                </div>
            )}

            {/* ── Recently Resolved ── */}
            <RecentlyResolvedTable rows={recentResolved} onViewAlert={onViewAlert} />
        </div>
    );
}

function AlertOverviewCards({ overview }) {
    const cards = [
        {
            key: "total",
            label: "Total Alerts",
            value: overview.total || 0,
            Icon: Bell,
            suffix: "",
            subtext: "All alerts generated",
            tone: "primary",
        },
        {
            key: "pending",
            label: "Pending Alerts",
            value: overview.pending || 0,
            Icon: AlertTriangle,
            suffix: "",
            subtext: "Awaiting clinic response",
            tone: (overview.pending || 0) > 0 ? "warning" : "primary",
        },
        {
            key: "resolved",
            label: "Resolved Alerts",
            value: overview.resolved || 0,
            Icon: CheckCircle,
            suffix: "",
            subtext: "Successfully addressed",
            tone: "success",
        },
        {
            key: "resolution_rate",
            label: "Resolution Rate",
            value: overview.resolution_rate || 0,
            Icon: Activity,
            suffix: "%",
            subtext: "Resolved ÷ Total × 100",
            tone: (overview.resolution_rate || 0) >= 80 ? "success" : "warning",
        },
    ];

    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
                <SummaryCard key={card.key} {...card} />
            ))}
        </div>
    );
}

function AlertDistributionChart({ data, selectedType, onTypeClick }) {
    const chartData = data.map((item) => ({
        name: item.label,
        key: item.key,
        Resolved: item.resolved,
        Pending: item.pending,
        total: item.total,
        recovery_rate: item.recovery_rate,
    }));

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        const row = chartData.find((d) => d.name === label);

        return (
            <div className="rounded-[14px] border p-3 shadow-xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                <p className="text-sm font-black">{label}</p>
                <p className="mt-1 text-xs font-bold" style={{ color: "var(--color-muted)" }}>
                    {row?.total || 0} total · {row?.recovery_rate || 0}% resolved
                </p>
                <div className="mt-2 space-y-1.5">
                    {payload.map((entry) => (
                        <div key={entry.name} className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-2 text-xs font-bold">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                {entry.name}
                            </span>
                            <span className="text-xs font-black">{entry.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <ChartCard
            title="Alert distribution by type"
            description="Resolved vs pending alerts per measurement category. Click a bar group to drill down into individual student cases."
        >
            {data.length ? (
                <div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                onClick={(payload) => {
                                    const key = payload?.activePayload?.[0]?.payload?.key;
                                    if (key) onTypeClick(key);
                                }}
                                style={{ cursor: "pointer" }}
                                barCategoryGap="32%"
                                barGap={4}
                            >
                                <XAxis
                                    dataKey="name"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: "var(--color-muted)", fontSize: 12, fontWeight: 800 }}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    width={32}
                                    tick={{ fill: "var(--color-muted)", fontSize: 11, fontWeight: 800 }}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: "color-mix(in srgb, var(--color-primary) 6%, transparent)" }} />
                                <Bar dataKey="Resolved" fill="var(--color-success)"   radius={[5, 5, 0, 0]} isAnimationActive={false} />
                                <Bar dataKey="Pending"  fill="var(--color-warning)"   radius={[5, 5, 0, 0]} isAnimationActive={false} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-4">
                        {[["Resolved", "var(--color-success)"], ["Pending", "var(--color-warning)"]].map(([label, color]) => (
                            <span key={label} className="flex items-center gap-2 text-xs font-black" style={{ color: "var(--color-muted)" }}>
                                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
                                {label}
                            </span>
                        ))}
                        <span className="text-xs font-bold" style={{ color: "var(--color-muted)" }}>· Click a group to drill down</span>
                    </div>
                </div>
            ) : (
                <EmptyChart message="No alert data for the selected filters. Try expanding the date range or clearing other filters." />
            )}
        </ChartCard>
    );
}

function AlertTypeKPICards({ data, selectedType, onTypeClick }) {
    return (
        <article className={`${cardClassName} p-5`} style={cardStyle}>
            <h3 className="text-base font-black">Alert type breakdown</h3>
            <p className="mt-1 mb-4 text-sm font-bold leading-5" style={{ color: "var(--color-muted)" }}>
                Cases, resolution count, and recovery rate per alert type.
            </p>
            <div className="space-y-3">
                {data.length ? (
                    data.map((item) => {
                        const config    = alertTypeConfig[item.key] || {};
                        const Icon      = config.Icon || Bell;
                        const isSelected = selectedType === item.key;
                        const rateColor = item.recovery_rate >= 80 ? "var(--color-success)" : item.recovery_rate >= 50 ? "var(--color-warning)" : "var(--color-error)";

                        return (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => onTypeClick(item.key)}
                                className="w-full rounded-[14px] border p-3 text-left transition hk-admin-nav-hover"
                                style={{
                                    borderColor: isSelected ? "var(--color-primary)" : "var(--color-border)",
                                    backgroundColor: isSelected
                                        ? "color-mix(in srgb, var(--color-primary) 8%, var(--color-card))"
                                        : "var(--color-surface)",
                                }}
                            >
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-sm font-black">
                                        <Icon size={14} style={{ color: config.color || "var(--color-primary)" }} />
                                        {item.label}
                                    </span>
                                    <span className="text-sm font-black" style={{ color: rateColor }}>
                                        {item.recovery_rate}%
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    {[["Total", item.total, "var(--color-text)"], ["Resolved", item.resolved, "var(--color-success)"], ["Pending", item.pending, "var(--color-warning)"]].map(
                                        ([lbl, val, clr]) => (
                                            <div key={lbl} className="rounded-[10px] border p-1.5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
                                                <p className="text-[0.62rem] font-black uppercase tracking-[0.1em]" style={{ color: "var(--color-muted)" }}>{lbl}</p>
                                                <p className="mt-0.5 text-base font-black" style={{ color: clr }}>{val}</p>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </button>
                        );
                    })
                ) : (
                    <p className="py-6 text-center text-sm font-bold" style={{ color: "var(--color-muted)" }}>
                        No alert data for the selected filters.
                    </p>
                )}
            </div>
        </article>
    );
}

function DrillDownStatusSelect({ value, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const options = [
        { value: "", label: "All Statuses" },
        { value: "Pending", label: "Pending" },
        { value: "Resolved", label: "Resolved" },
    ];
    const selectedOption = options.find((opt) => opt.value === value) || options[0];

    return (
        <div className="relative min-w-[140px] text-left" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex h-10 w-full items-center justify-between gap-3 rounded-[12px] border px-3 text-sm font-black outline-none transition hk-admin-nav-hover"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
                <span className="truncate">{selectedOption.label}</span>
                <span
                    className="flex shrink-0 items-center justify-center transition-transform duration-300"
                    style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                >
                    <ChevronDown size={14} style={{ color: "var(--color-muted)" }} />
                </span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full z-50 mt-2 w-full min-w-[140px] overflow-hidden rounded-[14px] border p-1 shadow-xl"
                        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
                    >
                            <div className="flex flex-col gap-0.5">
                                {options.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        className={`flex w-full items-center rounded-[10px] px-3 py-2.5 text-left text-xs font-black transition-colors ${value === option.value ? '' : 'hover:opacity-75'}`}
                                        style={{
                                            backgroundColor: value === option.value ? "var(--color-primary)" : "transparent",
                                            color: value === option.value ? "var(--color-bg)" : "var(--color-text)",
                                        }}
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                        }}
                                    >
                                        <span className="flex-1">{option.label}</span>
                                        {value === option.value && <Check size={14} />}
                                    </button>
                                ))}
                            </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function AlertDrillDownTable({ rows, typeLabel, onClose, onViewAlert }) {
    const [search, setSearch]         = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage]             = useState(1);
    const pageSize                    = 10;

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        
        // Ensure rows is an array, protecting against backend object serialization edge cases
        const validRows = Array.isArray(rows) ? rows : Object.values(rows || {});

        return validRows.filter((row) => {
            const matchesSearch = !term
                || [row.fullName, row.schoolId, row.department]
                    .some((v) => String(v || "").toLowerCase().includes(term));
            const matchesStatus = !statusFilter || row.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [rows, search, statusFilter]);

    useEffect(() => { setPage(1); }, [search, statusFilter]);

    const totalPages   = Math.max(1, Math.ceil(filtered.length / pageSize));
    const currentPage  = Math.min(page, totalPages);
    const displayed    = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <section className={`${cardClassName} p-5`} style={cardStyle}>
            {/* Header */}
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-primary)" }}>Drill-Down</p>
                    <h3 className="mt-1 text-lg font-black">{typeLabel} Alerts — Student Cases</h3>
                    <p className="mt-1 text-xs font-bold" style={{ color: "var(--color-muted)" }}>
                        {rows.length} total · {filtered.length} matching current filters
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <label className="flex h-10 items-center gap-2 rounded-[12px] border px-3" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                        <Search size={14} style={{ color: "var(--color-muted)" }} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search student..."
                            className="w-40 bg-transparent text-sm font-bold outline-none"
                        />
                    </label>
                    <DrillDownStatusSelect
                        value={statusFilter}
                        onChange={setStatusFilter}
                    />
                    <button
                        onClick={onClose}
                        className="h-10 rounded-[12px] border px-3 text-sm font-black transition hk-admin-nav-hover"
                        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
                    >
                        Close ✕
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-auto rounded-[12px] border" style={{ borderColor: "var(--color-border)" }}>
                <table className="w-full min-w-[820px] text-left text-xs">
                    <thead style={{ backgroundColor: "var(--color-surface)", color: "var(--color-muted)" }}>
                        <tr>
                            {["Student", "Department", "Original Measurement", "New Measurement", "Status", "Triggered", "Actions"].map((col) => (
                                <th key={col} className="border-b px-3 py-3 font-black" style={{ borderColor: "var(--color-border)" }}>{col}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {displayed.length ? (
                            displayed.map((row, idx) => (
                                <tr
                                    key={`${row.id}-${idx}`}
                                    className="border-b transition hover:bg-[color-mix(in_srgb,var(--color-text)_4%,transparent)]"
                                    style={{ borderColor: "var(--color-border)" }}
                                >
                                    <td className="px-3 py-3">
                                        <p className="font-black">{row.fullName}</p>
                                        <p className="font-bold" style={{ color: "var(--color-muted)" }}>{row.schoolId}</p>
                                    </td>
                                    <td className="px-3 py-3 font-bold" style={{ color: "var(--color-muted)" }}>{row.department}</td>
                                    <td className="px-3 py-3 font-black">{row.measurementValue}</td>
                                    <td className="px-3 py-3 font-black" style={{ color: row.newMeasurement ? "var(--color-success)" : "var(--color-muted)" }}>
                                        {row.newMeasurement || "—"}
                                    </td>
                                    <td className="px-3 py-3"><AlertStatusPill status={row.status} /></td>
                                    <td className="px-3 py-3 font-bold whitespace-nowrap" style={{ color: "var(--color-muted)" }}>{row.triggeredAt}</td>
                                    <td className="px-3 py-3">
                                        <button
                                            onClick={() => onViewAlert(row)}
                                            className="rounded-[10px] border px-3 py-1.5 text-xs font-black transition hk-admin-nav-hover"
                                            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-3 py-10 text-center text-sm font-bold" style={{ color: "var(--color-muted)" }}>
                                    No students match the current search or filter.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-bold" style={{ color: "var(--color-muted)" }}>
                    Showing {filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} cases
                </p>
                <div className="flex items-center gap-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-9 rounded-[12px] border px-3 text-xs font-black transition disabled:opacity-45 hk-admin-nav-hover" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>Previous</button>
                    <span className="rounded-[12px] border px-3 py-2 text-xs font-black" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-muted)" }}>Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-9 rounded-[12px] border px-3 text-xs font-black transition disabled:opacity-45 hk-admin-nav-hover" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>Next</button>
                </div>
            </div>
        </section>
    );
}

function AlertStatusPill({ status }) {
    const isResolved = status === "Resolved";
    const color      = isResolved ? "var(--color-success)" : "var(--color-warning)";

    return (
        <span
            className="inline-flex items-center rounded-full border px-2.5 py-1 text-[0.68rem] font-black"
            style={{
                borderColor: "var(--color-border)",
                backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
                color,
            }}
        >
            {status}
        </span>
    );
}

function RecentlyResolvedTable({ rows, onViewAlert }) {
    const [page, setPage] = useState(1);
    const pageSize        = 10;
    const totalPages      = Math.max(1, Math.ceil(rows.length / pageSize));
    const currentPage     = Math.min(page, totalPages);
    const displayed       = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    useEffect(() => {
        setPage((p) => Math.min(p, Math.max(1, Math.ceil(rows.length / pageSize))));
    }, [rows]);

    return (
        <section className={`${cardClassName} p-5`} style={cardStyle}>
            <div className="mb-4">
                <SectionHeader
                    title="Recently resolved alerts"
                    description="Latest clinic-resolved health alerts with original and new measurement values recorded by staff."
                />
            </div>
            <div className="overflow-auto rounded-[12px] border" style={{ borderColor: "var(--color-border)" }}>
                <table className="w-full min-w-[900px] text-left text-xs">
                    <thead style={{ backgroundColor: "var(--color-surface)", color: "var(--color-muted)" }}>
                        <tr>
                            {["Student", "Department", "Alert Type", "Original Measurement", "New Measurement", "Resolved By", "Date", "Actions"].map((col) => (
                                <th key={col} className="border-b px-3 py-3 font-black" style={{ borderColor: "var(--color-border)" }}>{col}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {displayed.length ? (
                            displayed.map((row, idx) => (
                                <tr
                                    key={`resolved-${row.id}-${idx}`}
                                    className="border-b transition hover:bg-[color-mix(in_srgb,var(--color-text)_4%,transparent)]"
                                    style={{ borderColor: "var(--color-border)" }}
                                >
                                    <td className="px-3 py-3">
                                        <p className="font-black">{row.fullName}</p>
                                        <p className="font-bold" style={{ color: "var(--color-muted)" }}>{row.schoolId}</p>
                                    </td>
                                    <td className="px-3 py-3 font-bold" style={{ color: "var(--color-muted)" }}>{row.department}</td>
                                    <td className="px-3 py-3 font-bold">{row.alertType}</td>
                                    <td className="px-3 py-3 font-black">{row.measurementValue}</td>
                                    <td className="px-3 py-3 font-black" style={{ color: "var(--color-success)" }}>{row.newMeasurement || "—"}</td>
                                    <td className="px-3 py-3 font-bold" style={{ color: "var(--color-muted)" }}>{row.reviewedBy}</td>
                                    <td className="px-3 py-3 font-bold whitespace-nowrap" style={{ color: "var(--color-muted)" }}>{row.triggeredAt}</td>
                                    <td className="px-3 py-3">
                                        <button
                                            onClick={() => onViewAlert(row)}
                                            className="rounded-[10px] border px-3 py-1.5 text-xs font-black transition hk-admin-nav-hover"
                                            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} className="px-3 py-10 text-center text-sm font-bold" style={{ color: "var(--color-muted)" }}>
                                    No recently resolved alerts found for the selected filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-bold" style={{ color: "var(--color-muted)" }}>
                    Showing {rows.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, rows.length)} of {rows.length} resolved alerts
                </p>
                <div className="flex items-center gap-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-9 rounded-[12px] border px-3 text-xs font-black transition disabled:opacity-45 hk-admin-nav-hover" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>Previous</button>
                    <span className="rounded-[12px] border px-3 py-2 text-xs font-black" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-muted)" }}>Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-9 rounded-[12px] border px-3 text-xs font-black transition disabled:opacity-45 hk-admin-nav-hover" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>Next</button>
                </div>
            </div>
        </section>
    );
}
