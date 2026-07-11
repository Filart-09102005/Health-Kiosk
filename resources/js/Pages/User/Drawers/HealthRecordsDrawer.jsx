import { useEffect, useState } from "react";
import { Activity, ArrowLeft, Barcode, CalendarClock, HeartPulse, Loader2, Printer, Ruler, Scale, TrendingUp } from "lucide-react";
import DrawerShell from "../../Global/DrawerShell";
import { printHealthReceipt } from "../../Global/receiptPrinter";
import { useAssistant } from "../AI-Assistant/context/AssistantProvider";
import { measurementService } from "../Measurements/services/measurementService";

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
    ["Weight", record.weight ? `${record.weight} kg` : "--"],
    ["BMI", record.bmi || "Unavailable until height sensor is connected"],
    ["Date", record.full_date || record.date_label || "--"],
    ["Time", record.time || "--"],
];

export default function HealthRecordsDrawer({ open, onClose, user = {} }) {
    const { enabled: assistantEnabled, speak } = useAssistant();
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return undefined;

        const controller = new AbortController();
        let alive = true;
        setLoading(true);
        setError("");

        measurementService
            .records(controller.signal, 100)
            .then((response) => {
                if (!alive) return;
                setRecords((response.data?.data || []).map((record) => formatApiRecord(record, user)));
            })
            .catch((requestError) => {
                if (requestError.name === "CanceledError") return;
                if (!alive) return;
                setError("Unable to load your health records right now.");
            })
            .finally(() => {
                if (alive) setLoading(false);
            });

        return () => {
            alive = false;
            controller.abort();
        };
    }, [open, user]);

    const close = () => {
        setSelectedRecord(null);
        onClose();
    };

    useEffect(() => {
        if (!open || !assistantEnabled) return;

        if (selectedRecord) {
            speak("Record details are open. Review the full measurement summary, then press Print receipt if you want to print this record again.");
            return;
        }

        speak("These are your Health Records. Press View details to see the full measurement summary. You can print the receipt again inside the details screen.");
    }, [assistantEnabled, open, selectedRecord, speak]);

    return (
        <DrawerShell
            open={open}
            onClose={close}
            title={selectedRecord ? "Record Details" : "Health Journey"}
            description={selectedRecord ? "Available kiosk readings for this visit." : "Long-term health records, body changes, and receipt actions."}
            closeOnOverlay={false}
            closeLabel="Exit"
        >
            {selectedRecord ? (
                <RecordDetails
                    record={selectedRecord}
                    onBack={() => {
                        speak("Returning to your Health Records list.");
                        setSelectedRecord(null);
                    }}
                />
            ) : (
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center gap-2 rounded-3xl border p-6 text-sm font-black" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-muted)" }}>
                            <Loader2 className="animate-spin" size={18} />
                            Loading health records
                        </div>
                    ) : null}

                    {!loading && error ? (
                        <div className="rounded-3xl border p-5 text-sm font-bold" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-error)" }}>
                            {error}
                        </div>
                    ) : null}

                    {!loading && !error && records.length === 0 ? (
                        <div className="rounded-3xl border p-5 text-sm font-bold" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-muted)" }}>
                            No saved health records yet. Complete an available kiosk health check to create your first record.
                        </div>
                    ) : null}

                    {!loading && !error && records.length > 0 ? (
                        <>
                            <HealthJourney records={records} />

                            <section className="space-y-3">
                                <div>
                                    <p className="text-sm font-black">Record timeline</p>
                                    <p className="mt-1 text-xs leading-5" style={{ color: "var(--color-muted)" }}>
                                        Latest kiosk checks first. Open any record to review details or print again.
                                    </p>
                                </div>

                                {records.map((record) => (
                                    <RecordCard
                                        key={record.id}
                                        record={record}
                                        onView={() => {
                                            speak("Opening record details. You can review the full summary and print this receipt again.");
                                            setSelectedRecord(record);
                                        }}
                                    />
                                ))}
                            </section>
                        </>
                    ) : null}
                </div>
            )}
        </DrawerShell>
    );
}

function formatApiRecord(record, fallbackUser = {}) {
    const createdAt = record.created_at ? new Date(record.created_at) : null;
    const validDate = createdAt && !Number.isNaN(createdAt.getTime());
    const apiUser = record.user || {};

    return {
        id: record.id,
        name: apiUser.name || `${fallbackUser?.firstname || "Health"} ${fallbackUser?.lastname || "Kiosk"}`.trim(),
        barcode: apiUser.barcode || fallbackUser?.barcode || "N/A",
        school_id: apiUser.barcode || fallbackUser?.barcode || "N/A",
        role: apiUser.role || fallbackUser?.role,
        department: apiUser.department || fallbackUser?.department,
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
            className="rounded-3xl border p-4"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-black">{record.date}</p>
                    <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>
                        {record.department || "Health record"} · Barcode {record.barcode}
                    </p>
                </div>
                <StatusBadge status={record.status} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                {detailRows(record).slice(0, 4).map(([label, value]) => (
                    <MetricTile key={label} label={label} value={value} />
                ))}
            </div>

            <div className="mt-4">
                <button
                    type="button"
                    onClick={onView}
                    className="w-full rounded-2xl border px-3 py-3 text-sm font-black transition hk-soft-hover"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                >
                    View details
                </button>
            </div>
        </article>
    );
}

function HealthJourney({ records }) {
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
                    <p className="text-sm font-black">Personal health timeline</p>
                    <p className="mt-1 text-xs leading-5" style={{ color: "var(--color-muted)" }}>
                        Track body and vital changes across every kiosk visit, from earlier school years to the latest record.
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

            <div className="rounded-2xl p-3" style={{ backgroundColor: "var(--color-surface)" }}>
                <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--color-muted)" }}>
                    <Activity size={14} />
                    Journey checkpoints
                </div>
                <div className="space-y-3">
                    {chronological.slice(-6).map((record, index, visibleRecords) => (
                        <JourneyPoint key={record.id} record={record} isLast={index === visibleRecords.length - 1} />
                    ))}
                </div>
            </div>
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
                    <p className="text-xs font-black">{metric.label}</p>
                </div>
                <span className="text-[0.65rem] font-black" style={{ color: delta && delta > 0 ? "var(--color-success)" : "var(--color-muted)" }}>
                    {direction}
                </span>
            </div>
            <p className="text-lg font-black">{value}</p>
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
                <span className="mt-1 h-3 w-3 rounded-full" style={{ backgroundColor: statusColor(record.status) }} />
                {!isLast ? <span className="mt-1 h-full min-h-10 w-px" style={{ backgroundColor: "var(--color-border)" }} /> : null}
            </div>
            <div className="min-w-0 flex-1 pb-2">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <p className="text-sm font-black">{record.department || "Health Check"}</p>
                        <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>
                            {record.full_date || record.date_label} · {record.time}
                        </p>
                    </div>
                    <StatusBadge status={record.status} />
                </div>
                <p className="mt-2 text-xs leading-5" style={{ color: "var(--color-muted)" }}>
                    Weight {record.weight || "--"} kg · Height {record.height || "--"} cm · BMI {record.bmi || "--"} · HR {record.heart_rate || "--"} bpm
                </p>
            </div>
        </div>
    );
}

function MiniTrend({ values }) {
    const cleanValues = values.filter((value) => value !== null);

    if (cleanValues.length < 2) {
        return <div className="mt-3 h-8 rounded-xl" style={{ backgroundColor: "color-mix(in srgb, var(--color-muted) 8%, transparent)" }} />;
    }

    const min = Math.min(...cleanValues);
    const max = Math.max(...cleanValues);
    const range = max - min || 1;
    const width = 120;
    const height = 34;
    const points = cleanValues
        .map((value, index) => {
            const x = cleanValues.length === 1 ? 0 : (index / (cleanValues.length - 1)) * width;
            const y = height - ((value - min) / range) * (height - 6) - 3;
            return `${x},${y}`;
        })
        .join(" ");

    return (
        <svg className="mt-3 h-8 w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
            <polyline points={points} fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function numberValue(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
}

function formatNumber(value) {
    return Number(value).toFixed(Math.abs(value) >= 10 ? 1 : 2).replace(/\.0$/, "");
}

function RecordDetails({ record, onBack }) {
    return (
        <div className="space-y-4">
            <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-black transition hk-soft-hover"
            >
                <ArrowLeft size={16} />
                Back to records
            </button>

            <section
                className="rounded-3xl border p-5"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-black">
                            <CalendarClock size={17} style={{ color: "var(--color-primary)" }} />
                            {record.date}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs font-bold" style={{ color: "var(--color-muted)" }}>
                            <span>Date: {record.full_date || record.date_label || "--"}</span>
                            <span>Time: {record.time || "--"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--color-muted)" }}>
                            <Barcode size={17} />
                            Barcode {record.barcode}
                        </div>
                    </div>
                    <StatusBadge status={record.status} />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                    {detailRows(record).map(([label, value]) => (
                        <MetricTile key={label} label={label} value={value} />
                    ))}
                </div>

                <PrintRecordButton record={record} label="Print receipt" fullWidth />
            </section>
        </div>
    );
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
            <p className="mt-1 font-black">{value}</p>
        </div>
    );
}

function StatusBadge({ status }) {
    return (
        <span
            className="rounded-full px-3 py-1 text-xs font-black"
            style={{
                color: statusColor(status),
                backgroundColor: "color-mix(in srgb, currentColor 10%, transparent)",
            }}
        >
            {status}
        </span>
    );
}
