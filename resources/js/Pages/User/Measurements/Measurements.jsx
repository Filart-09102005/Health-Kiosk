import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, ClipboardCheck, HeartPulse, Ruler, Scale, Thermometer } from "lucide-react";
import Header from "../components/Header";
import { useToast } from "../../Global/Toast";
import { authService } from "../../Auth/services/authService";
import HeartRateFlow from "./HeartRate/HeartRateFlow";
import TemperatureFlow from "./Temperature/TemperatureFlow";
import HeightFlow from "./Height/HeightFlow";
import WeightFlow from "./Weight/WeightFlow";
import { measurementService } from "./services/measurementService";
import MeasurementsSkeleton, { MEASUREMENTS_SKELETON_MIN_MS } from "./components/MeasurementsSkeleton";

const measurementOptions = [
    { key: "heart_rate", title: "Heart Rate & SpO2", description: "Pulse and oxygen saturation using the oximeter.", icon: HeartPulse, Flow: HeartRateFlow },
    { key: "temperature", title: "Temperature", description: "Infrared body temperature reading.", icon: Thermometer, Flow: TemperatureFlow },
    { key: "height", title: "Height", description: "Standing height from the ultrasonic sensor.", icon: Ruler, Flow: HeightFlow },
    { key: "weight", title: "Weight", description: "Weight from the load-cell platform.", icon: Scale, Flow: WeightFlow },
];

export default function Measurements({ navigate }) {
    const { showToast } = useToast();
    const [activeType, setActiveType] = useState(null);
    const [data, setData] = useState({ session: null, record: null });
    const [loading, setLoading] = useState(true);
    const shouldReduceMotion = useReducedMotion();
    const ActiveFlow = measurementOptions.find((item) => item.key === activeType)?.Flow;

    useEffect(() => {
        let alive = true;
        let loadingTimer = null;
        const startedAt = window.performance.now();
        const controller = new AbortController();

        measurementService
            .summary(controller.signal)
            .then((response) => {
                if (alive) setData(response.data);
            })
            .catch((error) => {
                if (error.name !== "CanceledError") {
                    showToast({ type: "error", title: "Session unavailable", message: "Please log in again." });
                }
            })
            .finally(() => {
                if (! alive) return;

                const elapsed = window.performance.now() - startedAt;
                const remaining = Math.max(MEASUREMENTS_SKELETON_MIN_MS - elapsed, 0);

                loadingTimer = window.setTimeout(() => {
                    if (alive) setLoading(false);
                }, remaining);
            });

        return () => {
            alive = false;
            if (loadingTimer) window.clearTimeout(loadingTimer);
            controller.abort();
        };
    }, [showToast]);

    const logout = async () => {
        await authService.logout();
        showToast({ type: "info", title: "Logged out", message: "Your session has ended." });
        navigate("/login");
    };

    const handleSaved = (record) => {
        setData((current) => ({ ...current, record }));
        setActiveType(null);
    };

    return (
        <AnimatePresence mode="wait" initial={false}>
            {loading ? (
                <MeasurementsSkeleton key="measurements-skeleton" />
            ) : (
                <motion.main
                    key="measurements-content"
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 0.24, ease: "easeOut" }}
                    className="hk-page min-h-screen px-4 py-6"
                    style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
                >
                    <div className="mx-auto max-w-7xl">
                        <motion.div
                            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 0.24, ease: "easeOut" }}
                        >
                            <Header
                                user={data.session?.user || { firstname: "Health", lastname: "Kiosk", role: "student", department: "COLLEGE" }}
                                onLogout={logout}
                                navigate={navigate}
                            />
                        </motion.div>

                        <section className="mt-8">
                            {ActiveFlow ? (
                                <ActiveFlow onBack={() => setActiveType(null)} onSaved={handleSaved} showToast={showToast} />
                            ) : (
                                <MeasurementPicker data={data} navigate={navigate} onSelect={setActiveType} />
                            )}
                        </section>
                    </div>
                </motion.main>
            )}
        </AnimatePresence>
    );
}

function MeasurementPicker({ data, onSelect, navigate }) {
    const shouldReduceMotion = useReducedMotion();
    const record = data.record;
    const completed = [
        record?.heart_rate && record?.spo2 ? "heart_rate" : null,
        record?.temperature ? "temperature" : null,
        record?.height ? "height" : null,
        record?.weight ? "weight" : null,
    ].filter(Boolean);

    return (
        <>
            <motion.div
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={shouldReduceMotion ? { duration: 0.01 } : { delay: 0.22, duration: 0.28, ease: "easeOut" }}
                className="overflow-hidden rounded-[1.75rem] border shadow-xl"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
            >
                <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-[1fr_22rem]">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.16em]" style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, transparent)", color: "var(--color-primary)" }}>
                                Session #{data.session?.session_number || "--"}
                            </span>
                            <span className="rounded-full px-3 py-1 text-xs font-black" style={{ backgroundColor: "var(--color-surface)", color: completed.length === 4 ? "var(--color-success)" : "var(--color-muted)" }}>
                                {completed.length === 4 ? "Ready for review" : "In progress"}
                            </span>
                        </div>
                        <h2 className="mt-5 max-w-3xl text-3xl font-black leading-tight md:text-5xl">Choose any measurement</h2>
                        <p className="mt-4 max-w-3xl text-sm leading-7 md:text-base" style={{ color: "var(--color-muted)" }}>
                            Start with any reading, repeat when needed, and keep the latest successful value as the final session result.
                        </p>
                    </div>

                    <div className="rounded-3xl border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--color-muted)" }}>Session progress</p>
                                <p className="mt-2 text-3xl font-black">{completed.length}/4</p>
                            </div>
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: "var(--color-card)", color: completed.length === 4 ? "var(--color-success)" : "var(--color-primary)" }}>
                                <ClipboardCheck size={28} />
                            </div>
                        </div>
                        <div className="mt-5 h-3 overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-border)" }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${(completed.length / 4) * 100}%`, backgroundColor: completed.length === 4 ? "var(--color-success)" : "var(--color-primary)" }} />
                        </div>
                        <div className="mt-4 flex items-center justify-between text-sm font-bold" style={{ color: "var(--color-muted)" }}>
                            <span>Status</span>
                            <span>{record?.health_status || "Incomplete"}</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            <motion.div
                className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
                initial="hidden"
                animate="show"
                variants={{
                    hidden: {},
                    show: {
                        transition: shouldReduceMotion
                            ? { staggerChildren: 0 }
                            : { delayChildren: 0.52, staggerChildren: 0.12 },
                    },
                }}
            >
                {measurementOptions.map((item, index) => {
                    const Icon = item.icon;
                    const done = completed.includes(item.key);

                    return (
                        <motion.button
                            key={item.key}
                            type="button"
                            variants={{
                                hidden: shouldReduceMotion
                                    ? { opacity: 1 }
                                    : { opacity: 0, y: 26, scale: 0.975 },
                                show: {
                                    opacity: 1,
                                    y: 0,
                                    scale: 1,
                                    transition: shouldReduceMotion
                                        ? { duration: 0.01 }
                                        : { duration: 0.52, ease: [0.16, 1, 0.3, 1] },
                                },
                            }}
                            whileHover={shouldReduceMotion ? undefined : { y: -4 }}
                            onClick={() => onSelect(item.key)}
                            className="group transform-gpu rounded-[1.5rem] border p-5 text-left shadow-sm will-change-transform hover:shadow-2xl"
                            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-2xl transition group-hover:scale-105" style={{ backgroundColor: done ? "color-mix(in srgb, var(--color-success) 12%, var(--color-surface))" : "var(--color-surface)", color: done ? "var(--color-success)" : "var(--color-primary)" }}>
                                    <Icon size={26} />
                                </div>
                                <span
                                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black"
                                    style={{
                                        backgroundColor: done ? "color-mix(in srgb, var(--color-success) 12%, transparent)" : "var(--color-surface)",
                                        color: done ? "var(--color-success)" : "var(--color-muted)",
                                    }}
                                >
                                    {done ? <Check size={13} /> : null}
                                    {done ? "Complete" : "Ready"}
                                </span>
                            </div>
                            <h3 className="mt-5 text-lg font-black">{item.title}</h3>
                            <p className="mt-2 text-sm leading-6" style={{ color: "var(--color-muted)" }}>
                                {item.description}
                            </p>
                            <div className="mt-5 flex items-center justify-between border-t pt-4 text-sm font-black" style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}>
                                <span>{done ? "Retake reading" : "Start reading"}</span>
                                <ArrowRight size={17} />
                            </div>
                        </motion.button>
                    );
                })}
            </motion.div>

            <motion.div
                className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={shouldReduceMotion ? { duration: 0.01 } : { delay: 1.08, duration: 0.32, ease: "easeOut" }}
            >
                <button
                    type="button"
                    onClick={() => navigate("/user/dashboard")}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-4 text-sm font-black transition hk-soft-hover"
                    style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                >
                    <ArrowLeft size={17} />
                    Back to Dashboard
                </button>
                <button
                    type="button"
                    onClick={() => navigate("/results")}
                    className="inline-flex items-center gap-2 rounded-2xl px-5 py-4 text-sm font-black text-white transition hk-primary-hover"
                    style={{ backgroundColor: "var(--color-primary)" }}
                >
                    Review Results
                    <ArrowRight size={17} />
                </button>
            </motion.div>
        </>
    );
}
