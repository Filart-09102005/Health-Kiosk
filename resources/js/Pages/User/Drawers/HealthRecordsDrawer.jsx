import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Barcode, CalendarClock, Printer } from "lucide-react";
import DrawerShell from "../../Global/DrawerShell";
import { printHealthReceipt } from "../../Global/receiptPrinter";
import { useAssistant } from "../AI-Assistant/context/AssistantProvider";

const sampleRecords = [
    {
        id: 1,
        name: "Health Kiosk User",
        barcode: "C-230204",
        date: "Today, 8:20 AM",
        date_label: "Today",
        full_date: "May 19, 2026",
        time: "8:20 AM",
        heart_rate: 78,
        spo2: 98,
        temperature: 36.6,
        height: 165,
        weight: 58,
        bmi: 21.3,
        status: "Normal",
        advice: "Vitals are within the expected range. Maintain healthy hydration.",
    },
    {
        id: 2,
        name: "Health Kiosk User",
        barcode: "C-230204",
        date: "Yesterday, 9:12 AM",
        date_label: "Yesterday",
        full_date: "May 18, 2026",
        time: "9:12 AM",
        heart_rate: 88,
        spo2: 97,
        temperature: 37.2,
        height: 165,
        weight: 58,
        bmi: 21.3,
        status: "Watch",
        advice: "Temperature is slightly elevated. Rest and recheck if symptoms continue.",
    },
];

const statusColor = (status) => {
    if (status === "Normal") return "var(--color-success)";
    if (status === "Alert") return "var(--color-error)";
    if (status === "Watch") return "var(--color-primary)";

    return "var(--color-gray)";
};

const detailRows = (record) => [
    ["Date", record.full_date || record.date_label || "--"],
    ["Time", record.time || "--"],
    ["BMI", record.bmi || "--"],
    ["Temp", record.temperature ? `${record.temperature} C` : "--"],
    ["Heart Rate", record.heart_rate ? `${record.heart_rate} bpm` : "--"],
    ["SpO2", record.spo2 ? `${record.spo2}%` : "--"],
    ["Height", record.height ? `${record.height} cm` : "--"],
    ["Weight", record.weight ? `${record.weight} kg` : "--"],
];

export default function HealthRecordsDrawer({ open, onClose, user = {} }) {
    const { enabled: assistantEnabled, speak } = useAssistant();
    const [selectedRecord, setSelectedRecord] = useState(null);

    const records = useMemo(() => sampleRecords.map((record) => ({
        ...record,
        name: `${user?.firstname || "Health"} ${user?.lastname || "Kiosk"}`.trim(),
        barcode: user?.barcode || record.barcode,
    })), [user?.barcode, user?.firstname, user?.lastname]);

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
            title={selectedRecord ? "Record Details" : "Health Records"}
            description={selectedRecord ? "Full kiosk reading summary for this visit." : "Recent kiosk readings and thermal receipt actions."}
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
                </div>
            )}
        </DrawerShell>
    );
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
                        Barcode {record.barcode}
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

                <div className="mt-5 rounded-2xl p-4" style={{ backgroundColor: "var(--color-surface)" }}>
                    <p className="text-xs font-black uppercase" style={{ color: "var(--color-muted)" }}>
                        Advice
                    </p>
                    <p className="mt-2 text-sm leading-6">{record.advice}</p>
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
