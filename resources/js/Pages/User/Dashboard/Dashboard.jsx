import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, Circle, HeartPulse, Ruler, Scale, Thermometer } from "lucide-react";
import Header from "../components/Header";
import { useToast } from "../../Global/Toast";
import { authService, getErrorMessage } from "../../Auth/services/authService";
import DashboardSkeleton, { USER_DASHBOARD_SKELETON_MIN_MS } from "./components/DashboardSkeleton";

const hasReading = (value) => value !== null && value !== undefined && value !== "";

const measurementCards = [
    {
        key: "heart_rate",
        title: "Heart Rate & SpO2",
        sensor: "Pulse oximeter",
        icon: HeartPulse,
        isComplete: (metrics) => hasReading(metrics?.heart_rate) && hasReading(metrics?.spo2),
        readings: (metrics) => [
            { label: "Heart Rate", value: hasReading(metrics?.heart_rate) ? Number(metrics.heart_rate).toFixed(2) : "--", unit: "bpm" },
            { label: "SpO2", value: hasReading(metrics?.spo2) ? Number(metrics.spo2).toFixed(2) : "--", unit: "%" },
        ],
    },
    {
        key: "temperature",
        title: "Temperature",
        sensor: "IR thermometer",
        icon: Thermometer,
        isComplete: (metrics) => hasReading(metrics?.temperature),
        readings: (metrics) => [
            { label: "Temperature", value: hasReading(metrics?.temperature) ? Number(metrics.temperature).toFixed(2) : "--", unit: "C" },
        ],
    },
    {
        key: "height",
        title: "Height",
        sensor: "Ultrasonic height",
        icon: Ruler,
        isComplete: (metrics) => hasReading(metrics?.height),
        readings: (metrics) => [
            { label: "Height", value: hasReading(metrics?.height) ? Number(metrics.height).toFixed(2) : "--", unit: "cm" },
        ],
    },
    {
        key: "weight",
        title: "Weight",
        sensor: "Load cell platform",
        icon: Scale,
        isComplete: (metrics) => hasReading(metrics?.weight),
        readings: (metrics) => [
            { label: "Weight", value: hasReading(metrics?.weight) ? Number(metrics.weight).toFixed(2) : "--", unit: "kg" },
        ],
    },
];

export default function Dashboard({ navigate }) {
    const { showToast } = useToast();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        let alive = true;
        let loadingTimer = null;
        const startedAt = window.performance.now();

        authService
            .userDashboard()
            .then((response) => {
                if (alive) setData(response.data);
            })
            .catch((error) => {
                showToast({
                    type: "error",
                    title: "Dashboard unavailable",
                    message: getErrorMessage(error),
                });

                if (error?.response?.status === 401 || error?.response?.status === 403) {
                    navigate("/login");
                }
            })
            .finally(() => {
                if (! alive) return;

                const elapsed = window.performance.now() - startedAt;
                const remaining = Math.max(USER_DASHBOARD_SKELETON_MIN_MS - elapsed, 0);

                loadingTimer = window.setTimeout(() => {
                    if (alive) setLoading(false);
                }, remaining);
            });

        return () => {
            alive = false;
            if (loadingTimer) window.clearTimeout(loadingTimer);
        };
    }, [navigate, showToast]);

    const logout = async () => {
        await authService.logout();
        showToast({ type: "info", title: "Logged out", message: "Your session has ended." });
        navigate("/login");
    };

    const user = data?.user || {};
    const metrics = data?.metrics || {};
    const firstName = user?.firstname || "User";
    const progressItems = measurementCards.map((card) => ({
        key: card.key,
        title: card.title,
        complete: card.isComplete(metrics),
    }));
    const completedCount = progressItems.filter((item) => item.complete).length;
    const progressPercent = Math.round((completedCount / progressItems.length) * 100);
    const missingItems = progressItems.filter((item) => ! item.complete).map((item) => item.title);
    const progressMessage = completedCount === 0
        ? "Start the flow to capture today's readings."
        : completedCount === progressItems.length
            ? "All required readings are captured for this kiosk session."
            : `${completedCount} of ${progressItems.length} readings captured. Missing ${missingItems.join(", ")}.`;

    return (
        <AnimatePresence mode="wait" initial={false}>
            {loading ? (
                <DashboardSkeleton key="user-dashboard-skeleton" />
            ) : (
                <motion.main
                    key="user-dashboard-content"
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
                            <Header user={user} onLogout={logout} navigate={navigate} />
                        </motion.div>

                <motion.section
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={shouldReduceMotion ? { duration: 0.01 } : { delay: 0.22, duration: 0.28, ease: "easeOut" }}
                    className="mt-8 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]"
                >
                    <div
                        className="overflow-hidden rounded-[2rem] border p-6 shadow-2xl md:p-8"
                        style={{
                            backgroundColor: "color-mix(in srgb, var(--color-card) 88%, transparent)",
                            borderColor: "var(--color-border)",
                        }}
                    >
                        <div className="max-w-2xl">
                            <p className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-primary)" }}>
                                Health Check Kiosk
                            </p>
                            <h2 className="mt-3 text-4xl font-black leading-tight md:text-5xl">
                                Welcome, {firstName}. Ready for your guided health check.
                            </h2>
                            <p className="mt-4 max-w-xl text-base leading-7" style={{ color: "var(--color-muted)" }}>
                                Follow each sensor step. The kiosk will guide heart rate, oxygen, temperature, height, weight, and BMI review in one smooth flow.
                            </p>
                        </div>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => navigate("/measurements")}
                                className="flex items-center gap-2 rounded-2xl px-5 py-4 text-sm font-black text-white transition hk-primary-hover"
                                style={{ backgroundColor: "var(--color-primary)" }}
                            >
                                Start Measurement
                                <ArrowRight size={18} />
                            </button>
                            <div
                                className="flex items-center gap-2 rounded-2xl border px-5 py-4 text-sm font-black"
                                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                            >
                                <CheckCircle2 size={18} style={{ color: "var(--color-success)" }} />
                                Sensors standing by
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-5">
                        <article className="rounded-[2rem] border p-6 shadow-xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                            <p className="text-sm font-black">Kiosk readiness</p>
                            <div className="mt-5 space-y-4">
                                {["Scanner connected", "Sensors idle", "Receipt printer ready"].map((item) => (
                                    <div key={item} className="flex items-center justify-between">
                                        <span className="text-sm font-bold" style={{ color: "var(--color-muted)" }}>{item}</span>
                                        <CheckCircle2 size={18} style={{ color: "var(--color-success)" }} />
                                    </div>
                                ))}
                            </div>
                        </article>

                        <article className="rounded-[2rem] border p-6 shadow-xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-black">Measurement progress</p>
                                <span className="text-sm font-black" style={{ color: "var(--color-primary)" }}>{progressPercent}%</span>
                            </div>
                            <div className="mt-4 h-3 overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-surface)" }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 0.45, ease: "easeOut" }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: "var(--color-primary)" }}
                                />
                            </div>
                            <p className="mt-4 text-sm font-bold leading-6" style={{ color: "var(--color-muted)" }}>
                                {completedCount} / {progressItems.length} completed
                            </p>
                            <p className="mt-1 text-sm leading-6" style={{ color: "var(--color-muted)" }}>
                                {progressMessage}
                            </p>
                            <div className="mt-4 grid gap-2">
                                {progressItems.map((item) => {
                                    const Icon = item.complete ? CheckCircle2 : Circle;

                                    return (
                                        <div key={item.key} className="flex items-center justify-between gap-3 text-xs font-black">
                                            <span style={{ color: item.complete ? "var(--color-text)" : "var(--color-muted)" }}>
                                                {item.title}
                                            </span>
                                            <Icon size={16} style={{ color: item.complete ? "var(--color-success)" : "var(--color-muted)" }} />
                                        </div>
                                    );
                                })}
                            </div>
                        </article>
                    </div>
                </motion.section>

                <section className="mt-8 border-t pt-6" style={{ borderColor: "var(--color-border)" }}>
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-primary)" }}>
                                Recent activity
                            </p>
                            <h3 className="mt-1 text-2xl font-black">Latest session readings</h3>
                            <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
                                Saved measurements from the current kiosk visit. Use Start Measurement to capture or update values.
                            </p>
                        </div>
                        <span
                            className="rounded-full border px-4 py-2 text-xs font-black"
                            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-muted)" }}
                        >
                            Read-only summary
                        </span>
                    </div>

                    <motion.div
                        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
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
                        {measurementCards.map((card, index) => {
                            const Icon = card.icon;
                            const readings = card.readings(metrics);
                            const hasValue = card.isComplete(metrics);

                            return (
                                <motion.article
                                    key={card.key}
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
                                    className="cursor-default transform-gpu rounded-[1.5rem] border p-5 shadow-sm will-change-transform"
                                    style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div
                                            className="flex h-12 w-12 items-center justify-center rounded-2xl"
                                            style={{ backgroundColor: "var(--color-surface)", color: "var(--color-primary)" }}
                                        >
                                            <Icon size={23} />
                                        </div>
                                        <span
                                            className="rounded-full px-3 py-1 text-xs font-black"
                                            style={{
                                                backgroundColor: "var(--color-surface)",
                                                color: hasValue ? "var(--color-success)" : "var(--color-muted)",
                                            }}
                                        >
                                            {hasValue ? "Recorded" : "Idle"}
                                        </span>
                                    </div>
                                    <h4 className="mt-5 text-base font-black">{card.title}</h4>
                                    <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>{card.sensor}</p>
                                    <div className="mt-5 grid gap-3">
                                        {readings.map((reading) => (
                                            <div key={reading.label} className="flex items-end justify-between gap-3">
                                                <div>
                                                    <p className="text-xs font-bold" style={{ color: "var(--color-muted)" }}>{reading.label}</p>
                                                    <span className="text-3xl font-black">{reading.value}</span>
                                                </div>
                                                <span className="pb-1 text-sm font-bold" style={{ color: "var(--color-muted)" }}>{reading.unit}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.article>
                            );
                        })}
                    </motion.div>
                </section>
                    </div>
                </motion.main>
            )}
        </AnimatePresence>
    );
}
