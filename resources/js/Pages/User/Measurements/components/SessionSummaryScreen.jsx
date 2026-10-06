import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Home, Printer, RotateCcw } from "lucide-react";
import { printHealthReceipt } from "../../../Global/receiptPrinter";
import { buildSummaryMetrics, HealthMetricGrid, HealthStatusHero } from "../../components/HealthSummary";

export default function SessionSummaryScreen({ data, onReturnHome, onRetake }) {
    const shouldReduceMotion = useReducedMotion();
    const [printing, setPrinting] = useState(false);

    const record = data?.record || {};
    const session = data?.session || {};
    const user = session.user || {};
    const metrics = buildSummaryMetrics(record);
    const statuses = record.measurement_statuses || {};

    /**
     * Print through the shared receipt printer.
     *
     * This screen used to POST to /api/user/print-thermal-receipt, which was
     * never implemented - the catch-all web route answered instead, so every
     * attempt failed with "The POST method is not supported for route
     * api/user/print-thermal-receipt". The Results screen already prints
     * correctly through printHealthReceipt, so both now use the same path and
     * send the same fields the receipt template expects.
     */
    const handlePrint = async () => {
        if (printing) return;

        setPrinting(true);
        try {
            const result = await printHealthReceipt({
                id: record.id || session?.id || session?.session_number,
                name: user.name || [user.firstname, user.lastname].filter(Boolean).join(" "),
                school_id: user.barcode,
                barcode: user.barcode,
                role: user.role,
                session_number: session?.session_number,
                date: new Date().toLocaleString(),
                heart_rate: record.heart_rate,
                spo2: record.spo2,
                temperature: record.temperature,
                height: record.height,
                weight: record.weight,
                bmi: record.bmi,
                status: record.health_status || "Incomplete",
            });

            // printHealthReceipt raises its own toasts, so only the hand-off back
            // to the dashboard is handled here.
            if (result?.ok) {
                window.setTimeout(() => onReturnHome(), 2000);
            }
        } finally {
            setPrinting(false);
        }
    };

    return (
        <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-5xl"
        >
            <div className="mb-8 text-center">
                <p className="text-xs font-black uppercase tracking-[0.28em]" style={{ color: "var(--color-primary)" }}>
                    Health check complete
                </p>
                <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl" style={{ color: "var(--color-text)" }}>
                    Your Health Summary
                </h1>
            </div>

            <div
                className="overflow-hidden rounded-[2.5rem] border shadow-2xl"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
            >
                <div className="px-6 pt-12 pb-10 md:px-12">
                    <HealthStatusHero status={record.health_status || "Incomplete"} advice={record.advice} />
                </div>

                <div
                    className="border-t px-6 py-10 md:px-12"
                    style={{
                        borderColor: "var(--color-border)",
                        backgroundColor: "color-mix(in srgb, var(--color-surface) 55%, var(--color-card))",
                    }}
                >
                    <div className="mb-6">
                        <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: "var(--color-primary)" }}>
                            Your readings
                        </p>
                        <h3 className="mt-1 text-2xl font-black">Session measurements</h3>
                    </div>

                    <HealthMetricGrid metrics={metrics} statuses={statuses} />
                </div>

                <div
                    className="flex flex-col gap-3 border-t px-6 py-8 sm:flex-row sm:items-center sm:justify-center md:px-12"
                    style={{ borderColor: "var(--color-border)" }}
                >
                    <button
                        type="button"
                        onClick={handlePrint}
                        disabled={printing}
                        className="flex items-center justify-center gap-3 rounded-2xl px-9 py-4 text-sm font-black transition hk-primary-hover disabled:cursor-wait disabled:opacity-70"
                        style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-content)" }}
                    >
                        <Printer size={19} />
                        {printing ? "Printing..." : "Print Report"}
                    </button>

                    <button
                        type="button"
                        onClick={onReturnHome}
                        disabled={printing}
                        className="flex items-center justify-center gap-3 rounded-2xl border px-9 py-4 text-sm font-black transition hk-soft-hover disabled:opacity-50"
                        style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                    >
                        <Home size={19} />
                        Return Home
                    </button>

                    {onRetake && (
                        <button
                            type="button"
                            onClick={onRetake}
                            disabled={printing}
                            className="flex items-center justify-center gap-3 rounded-2xl border px-9 py-4 text-sm font-black transition hk-soft-hover disabled:opacity-50"
                            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-muted)" }}
                        >
                            <RotateCcw size={19} />
                            Retake
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
