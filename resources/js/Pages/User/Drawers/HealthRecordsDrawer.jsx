import { useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Barcode, CalendarClock, ChevronLeft, ChevronRight, ChevronDown, GraduationCap, HeartPulse, Loader2, Printer, Ruler, Scale, TrendingUp, Sparkles, X, Filter, Check } from "lucide-react";
import DrawerShell from "../../Global/DrawerShell";
import useModalLayer from "../../../Global/useModalLayer";
import { printHealthReceipt } from "../../Global/receiptPrinter";
import { useAssistant } from "../AI-Assistant/context/AssistantProvider";
import { measurementService } from "../Measurements/services/measurementService";
import SchoolYearProgress from "./components/SchoolYearProgress";

const phDateTime = new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
});

const phDate = new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "2-digit",
    year: "numeric",
    timeZone: "Asia/Manila",
});

const phTime = new Intl.DateTimeFormat("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
});

const statusColor = (status) => {
    if (status === "Normal") return "var(--color-success)";
    if (status === "Alert") return "var(--color-error)";
    if (status === "Watch") return "var(--color-primary)";

    return "var(--color-gray)";
};

const detailRows = (record) => [
    ["Heart Rate", record.heart_rate ? `${record.heart_rate} bpm` : "--"],
    ["SpO2", record.spo2 ? `${record.spo2}%` : "--"],
    ["Body Temp", record.temperature ? `${record.temperature}°C` : "--"],
    ["Height", record.height ? `${record.height} cm` : "--"],
    ["Weight", record.weight ? `${record.weight} kg` : "--"],
    ["BMI", record.bmi || "Unavailable"],
    ["School Year", record.school_year || "Current S.Y."],
    ["Academic Level", record.academic_level || record.department || "--"],
    // The session number identifies the visit on the printed receipt and in the
    // admin records, so a student comparing the two needs it here as well.
    ["Kiosk Session", record.session?.session_number ? `#${record.session.session_number}` : "--"],
];

const ALL_GRADES_OPTION = { value: "ALL", label: "All Levels", badge: "All Years" };

const badgeForLevel = (level) => {
    if (/SHS/i.test(level)) return "Senior High";
    if (/JHS/i.test(level)) return "Junior High";
    if (/college|year/i.test(level)) return "College";
    return "Level";
};

/**
 * Filter options built from the levels actually present in the records.
 *
 * Was a hardcoded list of all ten levels from Grade 7 to 4th Year College,
 * which offered a student nine filters that could only ever return nothing.
 */
const buildGradeOptions = (records) => {
    const levels = [...new Set(records.map((record) => record.academic_level).filter(Boolean))];

    if (levels.length <= 1) return [];

    return [
        ALL_GRADES_OPTION,
        ...levels.map((level) => ({ value: level, label: level, badge: badgeForLevel(level) })),
    ];
};

export default function HealthRecordsDrawer({ open, onClose, user = {} }) {
    const { enabled: assistantEnabled, speak } = useAssistant();
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [gradeFilter, setGradeFilter] = useState("ALL");
    const ITEMS_PER_PAGE = 4;

    useEffect(() => {
        if (!open) {
            setRecords([]);
            setLoading(false);
            setError("");
            setCurrentPage(1);
            setGradeFilter("ALL");
            return undefined;
        }

        let alive = true;
        const controller = new AbortController();
        setLoading(true);
        setError("");

        measurementService
            .records(controller.signal, 100)
            .then((response) => {
                if (!alive) return;
                const fetchedList = (response.data?.data || (Array.isArray(response.data) ? response.data : []))
                    .map((r) => formatApiRecord(r, user))
                    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

                setRecords(fetchedList);
            })
            .catch((requestError) => {
                if (!alive) return;
                if (
                    requestError?.name === "CanceledError" ||
                    requestError?.name === "AbortError" ||
                    requestError?.code === "ERR_CANCELED"
                ) {
                    return;
                }
                setError("Failed to load health records.");
                setRecords([]);
            })
            .finally(() => {
                if (alive) {
                    setLoading(false);
                }
            });

        return () => {
            alive = false;
            controller.abort();
        };
    }, [open, user?.id]);

    const close = () => {
        setSelectedRecord(null);
        onClose();
    };

    useEffect(() => {
        if (!open || !assistantEnabled) return;

        if (selectedRecord) {
            speak("Record details modal is open. Review the full measurement summary, then press Print receipt if you want to print this record again.");
            return;
        }

        speak("These are your Health Records. Press View details on any record to open the centered details modal.");
    }, [assistantEnabled, open, selectedRecord, speak]);

    const gradeOptions = useMemo(() => buildGradeOptions(records), [records]);

    const filteredRecords = useMemo(() => {
        if (gradeFilter === "ALL") return records;
        return records.filter((r) => r.academic_level === gradeFilter);
    }, [records, gradeFilter]);

    const validTrendRecords = useMemo(() => {
        return records.filter(r => r.status !== "Incomplete" && r.weight && r.weight < 300 && r.height && r.height < 300);
    }, [records]);

    const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE) || 1;
    const paginatedRecords = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredRecords.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredRecords, currentPage]);

    const groupedPaginatedRecords = useMemo(() => {
        const groups = {};
        for (const record of paginatedRecords) {
            const sy = record.school_year || "Current S.Y.";
            if (!groups[sy]) groups[sy] = [];
            groups[sy].push(record);
        }
        return groups;
    }, [paginatedRecords]);

    return (
        <>
            <DrawerShell
                open={open}
                onClose={close}
                title="Health Journey"
                description="Long-term health records, body changes, and receipt actions."
                closeOnOverlay={false}
                closeLabel="Close"
                loading={loading}
                widePortrait
            >
                <div className="space-y-4">
                    {loading ? (
                        <div className="space-y-4">
                            {/* Exact Skeleton of HealthJourney Component */}
                            <section className="space-y-4 rounded-3xl border p-4" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="h-5 w-48 rounded-full bg-gray-200 dark:bg-gray-800 mb-2 animate-pulse" />
                                        <div className="h-3 w-3/4 max-w-sm rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
                                    </div>
                                    <div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse shrink-0" />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="rounded-2xl p-3 h-[120px] animate-pulse" style={{ backgroundColor: "var(--color-surface)" }}>
                                            <div className="mb-3 flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-xl bg-gray-200 dark:bg-gray-800" />
                                                    <div className="h-3 w-16 rounded-full bg-gray-200 dark:bg-gray-800" />
                                                </div>
                                                <div className="h-2 w-12 rounded-full bg-gray-200 dark:bg-gray-800" />
                                            </div>
                                            <div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-800 mb-2" />
                                            <div className="h-3 w-28 rounded-full bg-gray-200 dark:bg-gray-800 mb-3" />
                                            {/* MiniTrend placeholder */}
                                            <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-800" />
                                        </div>
                                    ))}
                                </div>

                                <div className="rounded-2xl p-3 h-[130px] animate-pulse" style={{ backgroundColor: "var(--color-surface)" }}>
                                    <div className="mb-4 h-3 w-48 rounded-full bg-gray-200 dark:bg-gray-800" />
                                    <div className="space-y-4 pl-1">
                                        {[1, 2].map((i) => (
                                            <div key={i} className="flex gap-3">
                                                <div className="flex flex-col items-center">
                                                    <div className="h-3 w-3 rounded-full bg-gray-200 dark:bg-gray-800" />
                                                    {i === 1 && <div className="h-8 w-0.5 bg-gray-200 dark:bg-gray-800 mt-1" />}
                                                </div>
                                                <div className="flex-1 space-y-2 pb-2">
                                                    <div className="flex justify-between">
                                                        <div className="h-3 w-24 rounded-full bg-gray-200 dark:bg-gray-800" />
                                                        <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-800" />
                                                    </div>
                                                    <div className="h-2 w-32 rounded-full bg-gray-200 dark:bg-gray-800" />
                                                    <div className="h-2 w-full max-w-sm rounded-full bg-gray-200 dark:bg-gray-800" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                            
                            {/* Exact Skeleton of Timeline Section */}
                            <section className="space-y-5">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="animate-pulse">
                                        <div className="h-5 w-56 rounded-full bg-gray-200 dark:bg-gray-800 mb-1" />
                                        <div className="h-3 w-64 rounded-full bg-gray-200 dark:bg-gray-800" />
                                    </div>
                                    <div className="w-full sm:w-80 animate-pulse">
                                        <div className="h-3 w-32 rounded-full bg-gray-200 dark:bg-gray-800 mb-1.5" />
                                        <div className="h-12 w-full rounded-2xl bg-gray-200 dark:bg-gray-800" />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        {/* School Year Header Skeleton */}
                                        <div className="flex items-center gap-2 pt-2 animate-pulse">
                                            <div className="h-4 w-4 rounded bg-gray-200 dark:bg-gray-800" />
                                            <div className="h-4 w-24 rounded-full bg-gray-200 dark:bg-gray-800" />
                                            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                                        </div>

                                        {/* Record Cards Skeleton */}
                                        <div className="space-y-1">
                                            {[1, 2].map((i) => (
                                                <div key={i} className="relative flex items-stretch gap-4 animate-pulse">
                                                    <div className="flex flex-col items-center shrink-0 w-6">
                                                        <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-800 opacity-25" />
                                                        <div className="my-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-200 dark:border-gray-800">
                                                            <div className="h-2.5 w-2.5 rounded-full bg-gray-200 dark:bg-gray-800" />
                                                        </div>
                                                        <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-800 opacity-60" />
                                                    </div>
                                                    
                                                    <div className="flex-1 pb-3">
                                                        <article className="rounded-3xl border p-4 h-[216px]" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div>
                                                                    <div className="flex gap-2 mb-2">
                                                                        <div className="h-4 w-16 rounded-md bg-gray-200 dark:bg-gray-800" />
                                                                        <div className="h-4 w-20 rounded-md bg-gray-200 dark:bg-gray-800" />
                                                                    </div>
                                                                    <div className="h-4 w-32 rounded-full bg-gray-200 dark:bg-gray-800 mb-1" />
                                                                    <div className="h-3 w-40 rounded-full bg-gray-200 dark:bg-gray-800" />
                                                                </div>
                                                                <div className="h-6 w-16 rounded-full bg-gray-200 dark:bg-gray-800" />
                                                            </div>
                                                            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                                                {[1, 2, 3, 4, 5, 6].map((j) => (
                                                                    <div key={j} className="h-9 w-full rounded bg-gray-200 dark:bg-gray-800" />
                                                                ))}
                                                            </div>
                                                            <div className="mt-4 h-[42px] w-full rounded-2xl bg-gray-200 dark:bg-gray-800" />
                                                        </article>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    ) : null}

                    {!loading && error ? (
                        <div className="rounded-3xl border p-5 text-sm font-bold" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-error)" }}>
                            {error}
                        </div>
                    ) : null}

                    {!loading && !error && records.length === 0 ? (
                        <div className="rounded-3xl border p-8 text-center space-y-3" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: "var(--color-surface)", color: "var(--color-primary)" }}>
                                <HeartPulse size={26} />
                            </div>
                            <h4 className="text-base font-black" style={{ color: "var(--color-text)" }}>No Health Records Found</h4>
                            <p className="text-xs max-w-sm mx-auto leading-5 font-semibold" style={{ color: "var(--color-muted)" }}>
                                You haven't recorded any health check sessions yet. Step up to the Health Kiosk to get your blood pressure, temperature, weight, and BMI measured!
                            </p>
                        </div>
                    ) : null}

                    {!loading && records.length > 0 ? (
                        <>
                            {/* ── Health Journey Growth Trends & Checkpoints ──
                                School-Year Progress gets the full record set, not
                                the trend-filtered one: it needs the incomplete
                                records in order to report how many it excluded. */}
                            <HealthJourney
                                records={validTrendRecords.length > 0 ? validTrendRecords : records}
                                schoolYearSection={<SchoolYearProgress records={records} />}
                            />

                            {/* ── Timeline Section with Custom Designed Grade Filter Select ── */}
                            <section className="space-y-5">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm font-black flex items-center gap-1.5" style={{ color: "var(--color-text)" }}>
                                            Record Timeline by School Year
                                            <Sparkles size={14} style={{ color: "var(--color-primary)" }} />
                                        </p>
                                        <p className="mt-0.5 text-xs leading-5" style={{ color: "var(--color-muted)" }}>
                                            High-contrast theme timeline connecting Grade 7 through 4th Year College.
                                        </p>
                                    </div>

                                    {/* Only worth showing once there is more than
                                        one level to choose between. */}
                                    {gradeOptions.length > 0 && (
                                        <CustomGradeFilterSelect
                                            value={gradeFilter}
                                            options={gradeOptions}
                                            onChange={(newGrade) => {
                                                setGradeFilter(newGrade);
                                                setCurrentPage(1);
                                            }}
                                        />
                                    )}
                                </div>

                                {/* Unbroken Continuous Line Timeline */}
                                <div className="space-y-6">
                                    {Object.entries(groupedPaginatedRecords).map(([schoolYear, syRecords]) => {
                                        return (
                                            <div key={schoolYear} className="space-y-3">
                                                {/* School Year Header */}
                                                <div className="flex items-center gap-2 pt-2">
                                                    <GraduationCap size={16} style={{ color: "var(--color-primary)" }} />
                                                    <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--color-primary)" }}>
                                                        {schoolYear}
                                                    </h4>
                                                    <div className="h-px flex-1" style={{ backgroundColor: "var(--color-border)" }} />
                                                </div>

                                                {/* Connected Timeline Nodes */}
                                                <div className="space-y-1">
                                                    {syRecords.map((record) => {
                                                        const globalIndex = paginatedRecords.findIndex((r) => r.id === record.id);
                                                        const isFirstGlobal = globalIndex === 0;
                                                        const isLastGlobal = globalIndex === paginatedRecords.length - 1;

                                                        return (
                                                            <div key={record.id} className="relative flex items-stretch gap-4">
                                                                {/* Vertical Stem */}
                                                                <div className="flex flex-col items-center shrink-0 w-6">
                                                                    {/* Upper Stem Line */}
                                                                    <div
                                                                        className="w-0.5 flex-1 transition-colors"
                                                                        style={{
                                                                            backgroundColor: "var(--color-primary)",
                                                                            opacity: isFirstGlobal ? 0.25 : 0.6,
                                                                        }}
                                                                    />

                                                                    {/* Circle Node Dot */}
                                                                    <div
                                                                        className="my-1 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all shadow-sm shrink-0"
                                                                        style={{
                                                                            backgroundColor: "var(--color-card)",
                                                                            borderColor: "var(--color-primary)",
                                                                        }}
                                                                    >
                                                                        <div
                                                                            className="h-2.5 w-2.5 rounded-full"
                                                                            style={{ backgroundColor: "var(--color-primary)" }}
                                                                        />
                                                                    </div>

                                                                    {/* Lower Stem Line */}
                                                                    <div
                                                                        className="w-0.5 flex-1 transition-colors"
                                                                        style={{
                                                                            backgroundColor: "var(--color-primary)",
                                                                            opacity: isLastGlobal ? 0.25 : 0.6,
                                                                        }}
                                                                    />
                                                                </div>

                                                                {/* Card Container */}
                                                                <div className="flex-1 pb-3">
                                                                    <RecordCard
                                                                        record={record}
                                                                        onView={() => {
                                                                            speak("Opening record details modal.");
                                                                            setSelectedRecord(record);
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* ── Pagination Controls ── */}
                                {totalPages > 1 && (
                                    <div className="mt-6 flex items-center justify-between rounded-2xl border p-3" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                                        <button
                                            type="button"
                                            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-black transition hk-soft-hover disabled:opacity-40"
                                            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                                        >
                                            <ChevronLeft size={15} />
                                            Previous
                                        </button>

                                        <span className="text-xs font-black" style={{ color: "var(--color-muted)" }}>
                                            Page <strong style={{ color: "var(--color-text)" }}>{currentPage}</strong> of {totalPages}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-black transition hk-soft-hover disabled:opacity-40"
                                            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                                        >
                                            Next
                                            <ChevronRight size={15} />
                                        </button>
                                    </div>
                                )}
                            </section>
                        </>
                    ) : null}
                </div>
            </DrawerShell>

            {/* ── Centered Record Details Modal ── */}
            {selectedRecord && (
                <RecordDetailsModal
                    record={selectedRecord}
                    onClose={() => {
                        setSelectedRecord(null);
                    }}
                />
            )}
        </>
    );
}

function CustomGradeFilterSelect({ value, onChange, options = [] }) {
    const [open, setOpen] = useState(false);
    const [placement, setPlacement] = useState("bottom");
    const containerRef = useRef(null);

    const selectedOption = options.find((opt) => opt.value === value) || options[0] || ALL_GRADES_OPTION;

    useEffect(() => {
        if (!open) return undefined;

        const updatePlacement = () => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;

            setPlacement((currentPlacement) => {
                if (currentPlacement === "bottom") {
                    if (spaceBelow < 180 && spaceAbove > 200) {
                        return "top";
                    }
                } else if (currentPlacement === "top") {
                    if (spaceBelow > 300) {
                        return "bottom";
                    }
                }
                return currentPlacement;
            });
        };

        updatePlacement();
        window.addEventListener("scroll", updatePlacement, true);
        window.addEventListener("resize", updatePlacement);

        return () => {
            window.removeEventListener("scroll", updatePlacement, true);
            window.removeEventListener("resize", updatePlacement);
        };
    }, [open]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener("mousedown", handleClickOutside);

        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    const isTop = placement === "top";

    return (
        <div className="relative w-full sm:w-auto" ref={containerRef}>
            <p className="text-xs font-black mb-1.5 flex items-center gap-1.5" style={{ color: "var(--color-muted)" }}>
                <Filter size={13} style={{ color: "var(--color-primary)" }} />
                Filter by School Year / Grade
            </p>

            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="w-full sm:w-80 h-12 flex items-center justify-between gap-3 rounded-2xl border px-4 py-2 text-sm font-black transition hk-soft-hover shadow-sm"
                style={{
                    backgroundColor: "var(--color-card)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text)",
                }}
            >
                <div className="flex items-center gap-2 truncate">
                    <span className="rounded-md px-2 py-0.5 text-[0.68rem] font-black uppercase border shrink-0" style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, var(--color-surface))", borderColor: "color-mix(in srgb, var(--color-primary) 30%, transparent)", color: "var(--color-primary)" }}>
                        {selectedOption.badge}
                    </span>
                    <span className="truncate">{selectedOption.label}</span>
                </div>
                <ChevronDown size={16} className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} style={{ color: "var(--color-muted)" }} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: isTop ? 6 : -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: isTop ? -4 : 4, scale: 1 }}
                        exit={{ opacity: 0, y: isTop ? 6 : -6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute right-0 z-[9600] w-full sm:w-80 max-h-72 overflow-y-auto hk-no-scrollbar rounded-2xl border p-2 shadow-2xl space-y-1 ${
                            isTop ? "bottom-full mb-2" : "top-full mt-1.5"
                        }`}
                        style={{
                            backgroundColor: "var(--color-card)",
                            borderColor: "var(--color-border)",
                        }}
                    >
                        {options.map((opt) => {
                            const isSelected = opt.value === value;

                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(opt.value);
                                        setOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-xs font-black transition ${isSelected ? "hk-flow-action-hint" : "hk-soft-hover"}`}
                                    style={{
                                        backgroundColor: isSelected ? "color-mix(in srgb, var(--color-primary) 14%, var(--color-surface))" : "transparent",
                                        color: isSelected ? "var(--color-primary)" : "var(--color-text)",
                                    }}
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <span className="rounded px-1.5 py-0.5 text-[9px] font-black uppercase border shrink-0" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: isSelected ? "var(--color-primary)" : "var(--color-muted)" }}>
                                            {opt.badge}
                                        </span>
                                        <span className="truncate">{opt.label}</span>
                                    </div>
                                    {isSelected && <Check size={14} style={{ color: "var(--color-primary)" }} />}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function calculateSchoolYear(date) {
    if (!date || Number.isNaN(date.getTime())) return "Current S.Y.";
    const yr = date.getFullYear();
    const m = date.getMonth();
    if (m >= 6) {
        return `S.Y. ${yr} - ${yr + 1}`;
    }
    return `S.Y. ${yr - 1} - ${yr}`;
}

/**
 * Academic level for a record, taken from the account's real academic fields.
 *
 * This used to map the record's school-year start onto a hardcoded grade
 * (2016 → Grade 7, 2017 → Grade 8 …), which assumed every student began Grade 7
 * in S.Y. 2016-2017. Every record taken this school year therefore came out as
 * "4th Year College" no matter whose it was.
 *
 * Returns an empty string when the account has no level recorded — the callers
 * hide the chip rather than show a made-up one.
 */
function deriveAcademicLevel(user = {}) {
    const department = String(user.department || "").toUpperCase();

    // College accounts carry year_level ("3rd Year"); basic ed carries
    // grade_level ("Grade 10"). Both are set on the user record.
    const yearLevel = String(user.year_level || "").trim();
    if (yearLevel) {
        return department === "COLLEGE" && !/college/i.test(yearLevel)
            ? `${yearLevel} College`
            : yearLevel;
    }

    const gradeLevel = String(user.grade_level || "").trim();
    if (!gradeLevel) return "";

    // Suffix is derived from the grade number, not guessed.
    const gradeNumber = Number(gradeLevel.match(/\d+/)?.[0]);
    if (Number.isFinite(gradeNumber)) {
        if (gradeNumber >= 11) return `${gradeLevel} (SHS)`;
        if (gradeNumber >= 7) return `${gradeLevel} (JHS)`;
    }

    return gradeLevel;
}

function formatApiRecord(record, fallbackUser = {}) {
    const createdAt = record.created_at ? new Date(record.created_at) : null;
    const validDate = createdAt && !Number.isNaN(createdAt.getTime());
    const apiUser = record.user || {};

    // The record's own snapshot wins: it is what was true on the day. Records
    // saved before that column existed fall back to the account's current
    // level. Nothing is inferred from the date.
    const schoolYear = record.school_year
        || (validDate ? calculateSchoolYear(createdAt) : "Current S.Y.");

    const academicLevel = record.academic_level || deriveAcademicLevel({
        department: apiUser.department || fallbackUser?.department,
        year_level: apiUser.year_level || fallbackUser?.year_level,
        grade_level: apiUser.grade_level || fallbackUser?.grade_level,
    });

    return {
        id: record.id,
        name: apiUser.name || `${fallbackUser?.firstname || "Health"} ${fallbackUser?.lastname || "Kiosk"}`.trim(),
        barcode: apiUser.barcode || fallbackUser?.barcode || "N/A",
        school_id: apiUser.barcode || fallbackUser?.barcode || "N/A",
        role: apiUser.role || fallbackUser?.role,
        department: apiUser.department || fallbackUser?.department || (academicLevel.includes("Grade") ? "BED" : "COLLEGE"),
        school_year: schoolYear,
        academic_level: academicLevel,
        session_number: record.session?.session_number,
        date: validDate ? phDateTime.format(createdAt) : "No date",
        date_label: validDate ? phDate.format(createdAt) : "No date",
        full_date: validDate ? phDate.format(createdAt) : "No date",
        time: validDate ? phTime.format(createdAt) : "--",
        heart_rate: record.heart_rate,
        spo2: record.spo2,
        temperature: record.temperature,
        height: record.height,
        weight: record.weight,
        bmi: record.bmi,
        status: formatStatus(record.health_status),
        created_at: record.created_at,
    };
}

function formatStatus(status) {
    if (status === "normal") return "Normal";
    if (status === "alert" || status === "high_risk") return "Alert";
    if (status === "watch" || status === "needs_review") return "Watch";

    return status || "Incomplete";
}

function RecordCard({ record, onView }) {
    return (
        <article
            className="rounded-3xl border p-4 transition-all"
            style={{
                backgroundColor: "var(--color-card)",
                borderColor: "var(--color-border)",
            }}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                            className="rounded-md px-2 py-0.5 text-[0.7rem] font-black border"
                            style={{
                                backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, var(--color-surface))",
                                borderColor: "color-mix(in srgb, var(--color-primary) 30%, transparent)",
                                color: "var(--color-primary)",
                            }}
                        >
                            {record.school_year}
                        </span>
                        {record.academic_level && (
                            <span
                                className="rounded-md px-2 py-0.5 text-[0.7rem] font-black border"
                                style={{
                                    backgroundColor: "var(--color-surface)",
                                    borderColor: "var(--color-border)",
                                    color: "var(--color-text)",
                                }}
                            >
                                {record.academic_level}
                            </span>
                        )}
                    </div>
                    <p className="text-sm font-black" style={{ color: "var(--color-text)" }}>{record.date}</p>
                    <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>
                        {record.department || "Health record"} · Barcode {record.barcode}
                    </p>
                </div>
                <StatusBadge status={record.status} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                {detailRows(record).slice(0, 6).map(([label, value]) => (
                    <MetricTile key={label} label={label} value={value} />
                ))}
            </div>

            <div className="mt-4">
                <button
                    type="button"
                    onClick={onView}
                    className="w-full rounded-2xl border px-3 py-2.5 text-sm font-black transition hk-soft-hover"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
                >
                    View details
                </button>
            </div>
        </article>
    );
}

// `schoolYearSection` is an optional slot rendered between the Overall Body
// Changes cards and the visit-by-visit checkpoints. A slot rather than an
// inlined section so this component keeps its existing shape and callers that
// pass nothing behave exactly as before.
function HealthJourney({ records, schoolYearSection = null }) {
    const chronological = [...records].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    const earliest = chronological[0];
    const latest = chronological[chronological.length - 1];
    const trendMetrics = [
        { key: "weight", label: "Weight", unit: "kg", icon: Scale },
        { key: "height", label: "Height", unit: "cm", icon: Ruler },
        { key: "bmi", label: "BMI", unit: "", icon: TrendingUp },
        { key: "heart_rate", label: "Heart Rate", unit: "bpm", icon: HeartPulse },
    ];

    return (
        <section className="space-y-4 rounded-3xl border p-4" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-black" style={{ color: "var(--color-text)" }}>Personal health timeline</p>
                    <p className="mt-1 text-xs leading-5" style={{ color: "var(--color-muted)" }}>
                        Track body and vital changes across every kiosk visit, from Grade 7 through 4th Year College.
                    </p>
                </div>
                <span className="rounded-full px-3 py-1 text-xs font-black" style={{ backgroundColor: "var(--color-surface)", color: "var(--color-primary)" }}>
                    {records.length} records
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {trendMetrics.map((metric) => (
                    <TrendSummaryCard key={metric.key} metric={metric} earliest={earliest} latest={latest} records={chronological} />
                ))}
            </div>

            {schoolYearSection}
        </section>
    );
}

function TrendSummaryCard({ metric, earliest, latest, records }) {
    const Icon = metric.icon;
    const start = numberValue(earliest?.[metric.key]);
    const end = numberValue(latest?.[metric.key]);
    const delta = start !== null && end !== null ? end - start : null;
    const direction = delta === null || Math.abs(delta) < 0.01 ? "Stable" : delta > 0 ? "Increased" : "Decreased";
    const value = end !== null ? `${formatNumber(end)}${metric.unit ? ` ${metric.unit}` : ""}` : "--";

    return (
        <div className="rounded-2xl p-3" style={{ backgroundColor: "var(--color-surface)" }}>
            <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, transparent)", color: "var(--color-primary)" }}>
                        <Icon size={15} />
                    </span>
                    <p className="text-xs font-black" style={{ color: "var(--color-text)" }}>{metric.label}</p>
                </div>
                <span className="text-[0.65rem] font-black" style={{ color: delta && delta > 0 ? "var(--color-success)" : "var(--color-muted)" }}>
                    {direction}
                </span>
            </div>
            <p className="text-lg font-black" style={{ color: "var(--color-text)" }}>{value}</p>
            <p className="mt-1 text-xs font-bold" style={{ color: "var(--color-muted)" }}>
                {delta === null ? "Not enough data yet" : `${delta > 0 ? "+" : ""}${formatNumber(delta)}${metric.unit ? ` ${metric.unit}` : ""} since first record`}
            </p>
            <MiniTrend values={records.map((record) => numberValue(record[metric.key]))} />
        </div>
    );
}

function JourneyPoint({ record, isLast }) {
    return (
        <div className="relative flex gap-3">
            <div className="flex flex-col items-center">
                <span className="mt-1 h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: "var(--color-primary)" }} />
                {!isLast ? (
                    <span className="mt-1 h-full min-h-10 w-0.5" style={{ backgroundColor: "var(--color-border)" }} />
                ) : null}
            </div>
            <div className="min-w-0 flex-1 pb-2">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <span className="text-xs font-black" style={{ color: "var(--color-text)" }}>{record.academic_level || record.department || "Health Check"}</span>
                            <span className="rounded px-1.5 py-0.2 text-[9px] font-black border" style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, var(--color-surface))", borderColor: "color-mix(in srgb, var(--color-primary) 28%, transparent)", color: "var(--color-primary)" }}>
                                {record.school_year}
                            </span>
                        </div>
                        <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                            {record.full_date || record.date_label} · {record.time}
                        </p>
                    </div>
                    <StatusBadge status={record.status} />
                </div>
                <p className="mt-2 text-xs leading-5 font-semibold" style={{ color: "var(--color-muted)" }}>
                    HR: {record.heart_rate ? `${record.heart_rate} bpm` : "--"} · SpO2: {record.spo2 ? `${record.spo2}%` : "--"} · Temp: {record.temperature ? `${record.temperature}°C` : "--"} · Ht: {record.height ? `${record.height} cm` : "--"} · Wt: {record.weight ? `${record.weight} kg` : "--"} · BMI: {record.bmi || "--"}
                </p>
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    return (
        <span
            className="rounded-full px-3 py-1 text-xs font-black"
            style={{
                backgroundColor: `color-mix(in srgb, ${statusColor(status)} 14%, transparent)`,
                color: statusColor(status),
            }}
        >
            {status}
        </span>
    );
}

function RecordDetailsModal({ record, onClose }) {
    useModalLayer(Boolean(record));

    if (!record) return null;

    const modalContent = (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
            >
                <div
                    className="absolute inset-0 cursor-default"
                    onClick={onClose}
                    aria-hidden="true"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 12 }}
                    transition={{ type: "spring", stiffness: 300, damping: 28 }}
                    className="relative z-[9995] w-full max-w-lg overflow-hidden rounded-3xl border shadow-2xl p-6 space-y-5"
                    style={{
                        backgroundColor: "var(--color-card)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-text)",
                    }}
                >
                    {/* Modal Header */}
                    <div className="flex items-start justify-between gap-4 border-b pb-4" style={{ borderColor: "var(--color-border)" }}>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-black" style={{ color: "var(--color-text)" }}>Record Details</h3>
                                <StatusBadge status={record.status} />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap mt-1.5">
                                <span className="rounded-lg px-2.5 py-0.5 text-xs font-black border" style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, var(--color-surface))", borderColor: "color-mix(in srgb, var(--color-primary) 30%, transparent)", color: "var(--color-primary)" }}>
                                    {record.school_year}
                                </span>
                                {record.academic_level && (
                                    <span className="rounded-lg px-2.5 py-0.5 text-xs font-black border" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                                        {record.academic_level}
                                    </span>
                                )}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition hk-soft-hover"
                            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-muted)" }}
                            aria-label="Close record modal"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Date, Time & Barcode info */}
                    <div className="flex items-center justify-between gap-3 text-xs font-bold" style={{ color: "var(--color-muted)" }}>
                        <div className="flex items-center gap-1.5">
                            <CalendarClock size={15} style={{ color: "var(--color-primary)" }} />
                            <span>{record.full_date || record.date_label || record.date} · {record.time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Barcode size={15} />
                            <span>Barcode {record.barcode}</span>
                        </div>
                    </div>

                    {/* Vitals Grid (6 tiles) */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {detailRows(record).slice(0, 6).map(([label, value]) => (
                            <MetricTile key={label} label={label} value={value} />
                        ))}
                    </div>

                    {/* Print Receipt Button */}
                    <div className="pt-2 border-t" style={{ borderColor: "var(--color-border)" }}>
                        <PrintRecordButton record={record} label="Print receipt" fullWidth />
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}

function PrintRecordButton({ record, label, fullWidth = false }) {
    const { enabled: assistantEnabled, speak } = useAssistant();
    const [printing, setPrinting] = useState(false);

    const handlePrint = async () => {
        if (printing) return;

        setPrinting(true);
        try {
            speak("Printing this health record again. Please wait for the receipt.");
            await printHealthReceipt(record);
        } finally {
            setPrinting(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handlePrint}
            disabled={printing}
            className={`${fullWidth ? "mt-5 w-full px-4" : "px-3"} flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black text-white transition hk-primary-hover disabled:cursor-not-allowed disabled:opacity-70 ${assistantEnabled ? "hk-flow-action-hint" : ""}`}
            style={{ backgroundColor: "var(--color-primary)" }}
        >
            <Printer size={16} />
            {printing ? "Printing..." : label}
        </button>
    );
}

function MetricTile({ label, value }) {
    return (
        <div className="rounded-2xl p-3" style={{ backgroundColor: "var(--color-surface)" }}>
            <p className="text-xs font-bold" style={{ color: "var(--color-muted)" }}>
                {label}
            </p>
            <p className="mt-1 font-black" style={{ color: "var(--color-text)" }}>{value}</p>
        </div>
    );
}

function MiniTrend({ values }) {
    const numeric = values.filter((val) => val !== null && !Number.isNaN(val) && val > 0);
    if (numeric.length < 2) return null;

    const min = Math.min(...numeric);
    const max = Math.max(...numeric);
    const range = max - min || 1;
    const padding = 6;
    const height = 44;
    const width = 140;

    const points = numeric.map((val, index) => {
        const x = (index / (numeric.length - 1)) * (width - 12) + 6;
        const y = height - padding - ((val - min) / range) * (height - 2 * padding);
        return { x, y };
    });

    const pointsString = points.map((p) => `${p.x},${p.y}`).join(" ");
    const areaString = `${points[0].x},${height} ${pointsString} ${points[points.length - 1].x},${height}`;
    const lastPoint = points[points.length - 1];

    return (
        <div className="mt-3 h-11 w-full">
            <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full overflow-visible">
                <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
                    </linearGradient>
                </defs>
                <polygon points={areaString} fill="url(#chartGradient)" />
                <polyline
                    fill="none"
                    stroke="var(--color-primary)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={pointsString}
                />
                <circle cx={lastPoint.x} cy={lastPoint.y} r="3.5" fill="var(--color-primary)" />
            </svg>
        </div>
    );
}

function numberValue(val) {
    if (val === null || val === undefined || val === "") return null;
    const parsed = Number(val);

    return Number.isNaN(parsed) ? null : parsed;
}

function formatNumber(val) {
    return val.toFixed(2).replace(/\.00$/, "");
}
