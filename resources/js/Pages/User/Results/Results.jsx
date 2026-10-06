import { useEffect, useState } from "react";
import axios from "axios";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Printer, RotateCcw } from "lucide-react";
import Header from "../components/Header";
import { authService } from "../../Auth/services/authService";
import { useToast } from "../../Global/Toast";
import { printHealthReceipt } from "../../Global/receiptPrinter";
import { measurementService } from "../Measurements/services/measurementService";
import { useAssistant } from "../AI-Assistant/context/AssistantProvider";
import { buildSummaryMetrics, HealthMetricGrid, HealthStatusHero, HealthSummarySkeleton } from "../components/HealthSummary";

export default function Results({ navigate }) {
    const { showToast } = useToast();
    const { enabled: assistantEnabled, speak } = useAssistant();
    const shouldReduceMotion = useReducedMotion();
    const [data, setData] = useState({ session: null, record: null });
    const [printing, setPrinting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showPrintHint, setShowPrintHint] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        measurementService
            .summary(controller.signal)
            .then((response) => {
                setData(response.data);
                setLoading(false);
            })
            .catch((error) => {
                // The cleanup below aborts the request, and under StrictMode the
                // effect is mounted twice — without this guard that self-inflicted
                // cancellation surfaced as a "Results unavailable" toast even
                // though the retry succeeded and the page rendered fine.
                if (axios.isCancel(error) || error?.code === "ERR_CANCELED") return;

                setLoading(false);
                showToast({ type: "error", title: "Results unavailable", message: "Please try again." });
            });

        return () => controller.abort();
    }, [showToast]);

    useEffect(() => {
        if (!assistantEnabled) {
            setShowPrintHint(false);
            return undefined;
        }

        speak("Your kiosk readings are now shown. Please press Print receipt if you need a copy.");
        setShowPrintHint(true);

        const timer = window.setTimeout(() => setShowPrintHint(false), 8000);
        return () => window.clearTimeout(timer);
    }, [assistantEnabled, speak]);

    const logout = async () => {
        await authService.logout();
        showToast({ type: "info", title: "Logged out", message: "Your session has ended." });
        navigate("/login");
    };

    const record = data.record || {};
    const user = data.session?.user || {};
    const metrics = buildSummaryMetrics(record);
    const statuses = record.measurement_statuses || {};

    const receipt = {
        id: record.id || data.session?.id || data.session?.session_number,
        name: user.name,
        school_id: user.barcode,
        barcode: user.barcode,
        role: user.role,
        session_number: data.session?.session_number,
        date: new Date().toLocaleString(),
        heart_rate: record.heart_rate,
        spo2: record.spo2,
        temperature: record.temperature,
        height: record.height,
        weight: record.weight,
        bmi: record.bmi,
        status: record.health_status || "Incomplete",
    };

    const handlePrintReceipt = async () => {
        if (printing) return;

        setShowPrintHint(false);
        setPrinting(true);
        try {
            speak("Printing your health result. Please wait for the receipt.");
            await printHealthReceipt(receipt);
        } finally {
            setPrinting(false);
        }
    };

    const handleContinueMeasurements = () => {
        speak("You can repeat an available health check to confirm your result.");
        navigate("/measurements");
    };

    const handleBackToDashboard = () => {
        speak("Returning to the dashboard.");
        navigate("/user/dashboard");
    };

    return (
        <main className="min-h-screen px-4 py-6" style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
            <div className="mx-auto max-w-7xl">
                <Header
                    user={{ firstname: user.firstname || user.name || "Health", lastname: user.lastname || "", ...user }}
                    onLogout={logout}
                    navigate={navigate}
                />

                <motion.section
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: "easeOut" }}
                    className="mx-auto mt-8 max-w-5xl overflow-hidden rounded-[2.5rem] border shadow-2xl"
                    style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                >
                    {loading ? <HealthSummarySkeleton /> : (
                    <>
                    <div className="px-6 pt-12 pb-10 md:px-12">
                        <HealthStatusHero
                            status={record.health_status || "Incomplete"}
                            sessionNumber={data.session?.session_number}
                            advice={record.advice}
                        />
                    </div>

                    <div
                        className="border-t px-6 py-10 md:px-12"
                        style={{
                            borderColor: "var(--color-border)",
                            backgroundColor: "color-mix(in srgb, var(--color-surface) 55%, var(--color-card))",
                        }}
                    >
                        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: "var(--color-primary)" }}>
                                    Your readings
                                </p>
                                <h3 className="mt-1 text-2xl font-black">Session measurements</h3>
                            </div>
                            <span
                                className="rounded-full border px-4 py-2 text-xs font-black"
                                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-muted)" }}
                            >
                                Read-only summary
                            </span>
                        </div>

                        <HealthMetricGrid metrics={metrics} statuses={statuses} />
                    </div>

                    <div
                        className="flex flex-col gap-3 border-t px-6 py-8 sm:flex-row sm:justify-center md:px-12"
                        style={{ borderColor: "var(--color-border)" }}
                    >
                        <button
                            type="button"
                            onClick={handlePrintReceipt}
                            disabled={printing}
                            className={`flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-sm font-black text-white transition hk-primary-hover disabled:cursor-not-allowed disabled:opacity-70 ${showPrintHint ? "hk-flow-action-hint" : ""}`}
                            style={{ backgroundColor: "var(--color-primary)" }}
                        >
                            <Printer size={18} />
                            {printing ? "Printing..." : "Print receipt"}
                        </button>

                        <button
                            type="button"
                            onClick={handleContinueMeasurements}
                            className="flex items-center justify-center gap-2 rounded-2xl border px-8 py-4 text-sm font-black transition hk-soft-hover"
                            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                        >
                            <RotateCcw size={17} />
                            Repeat health check
                        </button>

                        <button
                            type="button"
                            onClick={handleBackToDashboard}
                            className="flex items-center justify-center gap-2 rounded-2xl border px-8 py-4 text-sm font-black transition hk-soft-hover"
                            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                        >
                            <ArrowLeft size={17} />
                            Back to Dashboard
                        </button>
                    </div>
                    </>
                    )}
                </motion.section>
            </div>
        </main>
    );
}
