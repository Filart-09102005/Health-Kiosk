import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Activity, ArrowRight, CheckCircle2, Circle, Cpu, FileClock, HeartPulse, HelpCircle, LockKeyhole, LogOut, Palette, Printer, RefreshCcw, Ruler, Scale, Thermometer, UserRound } from "lucide-react";
import Header from "../components/Header";
import PulseBorder from "../components/PulseBorder";
import { useToast } from "../../Global/Toast";
import { authService, getErrorMessage } from "../../Auth/services/authService";
import DashboardSkeleton, { USER_DASHBOARD_SKELETON_MIN_MS } from "./components/DashboardSkeleton";
import { useAssistant } from "../AI-Assistant/context/AssistantProvider";
import { ASSISTANT_PROMPTS } from "../AI-Assistant/constants/assistantPrompts";
import { toneFor } from "../utils/measurementStatus";

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
        key: "weight",
        title: "Weight",
        sensor: "Load cell platform",
        icon: Scale,
        isComplete: (metrics) => hasReading(metrics?.weight),
        readings: (metrics) => [
            { label: "Weight", value: hasReading(metrics?.weight) ? Number(metrics.weight).toFixed(2) : "--", unit: "kg" },
        ],
    },
    {
        key: "temperature",
        title: "Temperature",
        sensor: "Body temperature sensor",
        icon: Thermometer,
        isComplete: (metrics) => hasReading(metrics?.temperature),
        readings: (metrics) => [
            { label: "Temperature", value: hasReading(metrics?.temperature) ? Number(metrics.temperature).toFixed(2) : "--", unit: "°C" },
        ],
    },
    {
        key: "height",
        title: "Height",
        sensor: "Height measuring sensor",
        icon: Ruler,
        isComplete: (metrics) => hasReading(metrics?.height),
        readings: (metrics) => [
            { label: "Height", value: hasReading(metrics?.height) ? Number(metrics.height).toFixed(2) : "--", unit: "cm" },
        ],
    },
    {
        key: "bmi",
        title: "BMI",
        sensor: "Calculated reading",
        icon: Activity,
        isComplete: (metrics) => hasReading(metrics?.weight) && hasReading(metrics?.height),
        readings: (metrics) => {
            const hasBoth = hasReading(metrics?.weight) && hasReading(metrics?.height);
            let bmiValue = "--";
            if (hasBoth) {
                const heightM = Number(metrics.height) / 100;
                bmiValue = (Number(metrics.weight) / (heightM * heightM)).toFixed(2);
            }
            return [
                { label: "BMI", value: bmiValue, unit: "kg/m²" },
            ];
        }
    },
];

const assistantHelpItems = [
    {
        key: "records",
        title: "How to view health records",
        icon: FileClock,
        hint: "records",
        answer: "To view Health Records, tap your account menu at the top right, then press Health Records. You can view details and print a receipt again inside the details screen.",
    },
    {
        key: "profile",
        title: "How to view my profile",
        icon: UserRound,
        hint: "profile",
        answer: "To view your profile, tap your account menu at the top right, then press Profile. Your account information will open in a side panel.",
    },
    {
        key: "appearance",
        title: "How to change appearance",
        icon: Palette,
        hint: "appearance",
        answer: "To change appearance, press the Appearance button at the top. You can choose light mode, dark mode, or follow the system theme.",
    },
    {
        key: "mode",
        title: "How to switch to Manual Mode",
        icon: Cpu,
        hint: "startMeasurement",
        answer: ASSISTANT_PROMPTS.modeGuide,
    },
    {
        key: "password",
        title: "How to change password",
        icon: LockKeyhole,
        hint: "profile",
        answer: "To change your password, tap your account menu at the top right, then press Profile. In the profile panel, press Change Password. A window will open where you enter your current password, then your new password twice.",
    },
    {
        key: "editProfile",
        title: "How to edit my profile",
        icon: UserRound,
        hint: "profile",
        answer: "To edit your profile, tap your account menu at the top right, then press Profile. Your details start locked. Press the Edit button to unlock the fields, make your changes, then press Save changes.",
    },
    {
        key: "print",
        title: "How to print results",
        icon: Printer,
        hint: "results",
        answer: "To print your health result, press Review Results, then press Print receipt. Please wait for the receipt to finish printing.",
    },
    {
        key: "repeat",
        title: "How to check again",
        icon: RefreshCcw,
        hint: "measure",
        answer: "If you want to make sure your result is accurate, press Check Again or Repeat health check, then choose the reading you want to repeat.",
    },
    {
        key: "logout",
        title: "How to log out",
        icon: LogOut,
        hint: "logout",
        answer: "To log out, tap your account menu at the top right, press Logout, then confirm. The kiosk will return to the login screen.",
    },
];

const revealViewport = { once: false, amount: 0.18, margin: "0px 0px -80px 0px" };
const revealVariants = {
    hidden: { opacity: 0, y: 34, filter: "blur(3px)" },
    visible: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
    },
};

const softRevealVariants = {
    hidden: { opacity: 0, y: 22 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, ease: "easeOut" },
    },
};

export default function Dashboard({ navigate }) {
    const { showToast } = useToast();
    const { enabled: assistantEnabled, speak } = useAssistant();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showStartHint, setShowStartHint] = useState(false);
    const [activeHelpHint, setActiveHelpHint] = useState(null);
    const helpHintTimer = useRef(null);
    const shouldReduceMotion = useReducedMotion();
    const stableMeasurementCards = useMemo(() => measurementCards, []);

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

    const showHelpTargetHint = (hint) => {
        if (helpHintTimer.current) {
            window.clearTimeout(helpHintTimer.current);
        }

        setActiveHelpHint(hint);
        helpHintTimer.current = window.setTimeout(() => setActiveHelpHint(null), 8000);
    };

    useEffect(() => {
        return () => {
            if (helpHintTimer.current) {
                window.clearTimeout(helpHintTimer.current);
            }
        };
    }, []);

    const user = data?.user || {};
    const metrics = data?.metrics || {};
    const measurementStatuses = data?.measurement_statuses || {};
    const firstName = user?.firstname || "User";
    const progressItems = stableMeasurementCards.map((card) => ({
        key: card.key,
        title: card.title,
        complete: card.isComplete(metrics),
    }));
    const completedCount = progressItems.filter((item) => item.complete).length;
    const allMeasurementsComplete = completedCount === progressItems.length;
    const progressPercent = Math.round((completedCount / progressItems.length) * 100);
    const missingItems = progressItems.filter((item) => ! item.complete).map((item) => item.title);
    const progressMessage = completedCount === 0
        ? "Start the health check to record today's available readings."
        : completedCount === progressItems.length
            ? "All available kiosk readings are recorded for this session."
            : `${completedCount} of ${progressItems.length} readings captured. Missing ${missingItems.join(", ")}.`;

    useEffect(() => {
        if (!loading && assistantEnabled) {
            if (allMeasurementsComplete) {
                speak(`${firstName}, all available health readings are complete. Please press Review Results to view or print your health result. You may press Start Health Check only if you want to check again.`);
                setShowStartHint(false);
                return undefined;
            }

            speak(`Welcome, ${firstName}. To check your health, press Start Health Check and choose the reading you want to take.`);
            setShowStartHint(true);

            const timer = window.setTimeout(() => setShowStartHint(false), 8000);
            return () => window.clearTimeout(timer);
        }

        setShowStartHint(false);
        return undefined;
    }, [allMeasurementsComplete, assistantEnabled, firstName, loading, speak]);

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
                            initial={shouldReduceMotion ? { opacity: 1 } : "hidden"}
                            whileInView={shouldReduceMotion ? { opacity: 1 } : "visible"}
                            viewport={revealViewport}
                            variants={softRevealVariants}
                        >
                            <Header user={user} onLogout={logout} navigate={navigate} guidedHint={activeHelpHint} />
                        </motion.div>

                <motion.section
                    initial={shouldReduceMotion ? { opacity: 1 } : "hidden"}
                    whileInView={shouldReduceMotion ? { opacity: 1 } : "visible"}
                    viewport={revealViewport}
                    variants={revealVariants}
                    className="mt-8 grid grid-cols-[1.5fr_1fr] gap-2 sm:gap-5"
                >
                    <div
                        className="overflow-hidden rounded-xl border p-3 shadow-2xl sm:rounded-[2rem] sm:p-6 md:p-8"
                        style={{
                            backgroundColor: "color-mix(in srgb, var(--color-card) 88%, transparent)",
                            borderColor: "var(--color-border)",
                        }}
                    >
                        <div className="max-w-2xl">
                            <div className="flex flex-nowrap items-center gap-1.5 sm:gap-3">
                                <p className="shrink-0 text-[0.6rem] font-black uppercase tracking-[0.1em] sm:text-sm sm:tracking-[0.18em]" style={{ color: "var(--color-primary)" }}>
                                    Health Check Kiosk
                                </p>
                                {/* Shown here rather than only beside the progress bar: the session
                                    number identifies this visit on the receipt and in the admin
                                    records, so it has to be readable without scrolling. */}
                                {data?.session?.session_number ? (
                                    <span
                                        className="shrink-0 rounded-full border px-1.5 py-0.5 text-[0.6rem] font-black tabular-nums sm:px-3 sm:py-1 sm:text-xs"
                                        style={{
                                            backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, var(--color-surface))",
                                            borderColor: "color-mix(in srgb, var(--color-primary) 32%, var(--color-border))",
                                            color: "var(--color-primary)",
                                        }}
                                    >
                                        Kiosk Session #{data.session.session_number}
                                    </span>
                                ) : null}
                            </div>
                            <h2 className="mt-2 text-base font-black leading-tight sm:mt-3 sm:text-3xl md:text-4xl lg:text-5xl">
                                Welcome, {firstName}. Start with barcode scanning, then complete your health check.
                            </h2>
                            <p className="mt-2 max-w-xl text-xs leading-5 sm:mt-4 sm:text-base sm:leading-7" style={{ color: "var(--color-muted)" }}>
                                The kiosk guides the available readings for Heart Rate and SpO2, Temperature, Height, and Weight. Follow the screen instructions for each device.
                            </p>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-8 sm:gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowStartHint(false);
                                    speak(allMeasurementsComplete ? "You can repeat a reading to confirm your result. Choose the health check you want to take again." : "startMeasurement");
                                    navigate("/measurements");
                                }}
                                className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-[0.65rem] font-black text-white transition hk-primary-hover sm:gap-2 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm ${showStartHint || activeHelpHint === "measure" || activeHelpHint === "startMeasurement" ? "hk-start-measure-hint" : ""}`}
                                style={{ backgroundColor: "var(--color-primary)" }}
                            >
                                {allMeasurementsComplete ? "Check Again" : "Start Health Check"}
                                <ArrowRight size={14} className="sm:hidden" />
                                <ArrowRight size={18} className="hidden sm:block" />
                            </button>
                            {allMeasurementsComplete ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        speak("Opening your health results. You can print your receipt on the results screen.");
                                        navigate("/results");
                                    }}
                                    className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-[0.65rem] font-black text-white transition hk-primary-hover sm:gap-2 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm ${activeHelpHint === "results" || allMeasurementsComplete ? "hk-flow-action-hint" : ""}`}
                                    style={{ backgroundColor: "var(--color-success)" }}
                                >
                                    Review Results
                                    <ArrowRight size={14} className="sm:hidden" />
                                    <ArrowRight size={18} className="hidden sm:block" />
                                </button>
                            ) : null}
                            <div
                                className="flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[0.65rem] font-black sm:gap-2 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm"
                                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                            >
                                <CheckCircle2 size={14} className="sm:hidden" style={{ color: "var(--color-success)" }} />
                                <CheckCircle2 size={18} className="hidden sm:block" style={{ color: "var(--color-success)" }} />
                                Available devices ready
                            </div>
                        </div>
                    </div>

                    <div>
                        <article className="rounded-xl border p-3 shadow-xl sm:rounded-[2rem] sm:p-6" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                            <div className="flex items-start gap-2 sm:gap-3">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-11 sm:w-11 sm:rounded-2xl" style={{ backgroundColor: "var(--color-surface)", color: "var(--color-primary)" }}>
                                    <HelpCircle size={15} className="sm:hidden" />
                                    <HelpCircle size={22} className="hidden sm:block" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-black sm:text-sm">Voice help</p>
                                    <p className="mt-1 hidden text-xs leading-5 sm:block" style={{ color: "var(--color-muted)" }}>
                                        {assistantEnabled ? "Tap a question to hear a fixed assistant answer." : "Turn on Assistant Mode first to hear answers."}
                                    </p>
                                </div>
                            </div>
                            <div className="voice-help-stack-wrap mt-2 sm:mt-5">
                                <div
                                    className="voice-help-stack"
                                    aria-label="Voice help questions"
                                >
                                    {assistantHelpItems.map((item, index) => {
                                        const Icon = item.icon;

                                        return (
                                            <button
                                                key={item.key}
                                                type="button"
                                                onClick={() => {
                                                    if (! assistantEnabled) {
                                                        showHelpTargetHint("assistant");
                                                        return;
                                                    }

                                                    speak(item.answer);
                                                    showHelpTargetHint(item.hint);

                                                    if (item.key === "mode") {
                                                        setTimeout(() => {
                                                            setShowStartHint(false);
                                                            navigate("/measurements");
                                                        }, 1500);
                                                    }
                                                }}
                                                className={`voice-help-item ${! assistantEnabled ? "cursor-not-allowed opacity-70" : ""}`}
                                                style={{
                                                    "--stack-index": index,
                                                    borderColor: activeHelpHint === "assistant" && !assistantEnabled ? "var(--color-primary)" : "var(--color-border)",
                                                }}
                                                aria-disabled={!assistantEnabled}
                                            >
                                                <Icon size={17} style={{ color: "var(--color-primary)" }} />
                                                <span className="min-w-0 flex-1">{item.title}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </article>
                    </div>
                </motion.section>

                <motion.section
                    initial={shouldReduceMotion ? { opacity: 1 } : "hidden"}
                    whileInView={shouldReduceMotion ? { opacity: 1 } : "visible"}
                    viewport={revealViewport}
                    variants={revealVariants}
                    className="mt-[29px]"
                >
                    <article className="rounded-[2rem] border p-6 shadow-xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-black">Measurement progress</p>
                                <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
                                    {completedCount} / {progressItems.length} available readings completed
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                {/* The kiosk session number was created on sign-in and carried on
                                    every reading and receipt, but was never shown to the student.
                                    It belongs beside the progress for this visit, which is the
                                    thing the session actually scopes. */}
                                <div className="text-right">
                                    <p className="text-[0.65rem] font-black uppercase tracking-[0.16em]" style={{ color: "var(--color-muted)" }}>
                                        Kiosk session
                                    </p>
                                    <p className="text-lg font-black tabular-nums" style={{ color: "var(--color-text)" }}>
                                        {data?.session?.session_number ? `#${data.session.session_number}` : "--"}
                                    </p>
                                </div>
                                <span className="text-2xl font-black" style={{ color: "var(--color-primary)" }}>{progressPercent}%</span>
                            </div>
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
                        <p className="mt-4 text-sm leading-6" style={{ color: "var(--color-muted)" }}>
                            {progressMessage}
                        </p>
                        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                            {progressItems.map((item) => {
                                const Icon = item.complete ? CheckCircle2 : Circle;

                                return (
                                    <div
                                        key={item.key}
                                        className="relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl border p-4 text-sm font-black"
                                        style={{
                                            backgroundColor: item.complete
                                                ? "color-mix(in srgb, var(--color-success) 8%, var(--color-surface))"
                                                : "var(--color-surface)",
                                            borderColor: item.complete
                                                ? "color-mix(in srgb, var(--color-success) 35%, var(--color-border))"
                                                : "var(--color-border)",
                                        }}
                                    >
                                        {item.complete && <PulseBorder radius={16} />}
                                        <span className="relative z-10" style={{ color: item.complete ? "var(--color-text)" : "var(--color-muted)" }}>
                                            {item.title}
                                        </span>
                                        <Icon className="relative z-10" size={18} style={{ color: item.complete ? "var(--color-success)" : "var(--color-muted)" }} />
                                    </div>
                                );
                            })}
                        </div>
                    </article>
                </motion.section>

                <motion.section
                    initial={shouldReduceMotion ? { opacity: 1 } : "hidden"}
                    whileInView={shouldReduceMotion ? { opacity: 1 } : "visible"}
                    viewport={{ once: false, amount: 0.12, margin: "0px 0px -100px 0px" }}
                    variants={revealVariants}
                    className="mt-12 border-t pt-8"
                    style={{ borderColor: "var(--color-border)" }}
                >
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-primary)" }}>
                                Recent activity
                            </p>
                            <h3 className="mt-1 text-2xl font-black">Latest session readings</h3>
                            <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
                                Saved readings from the current kiosk visit. Use Start Health Check to record or update a value.
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
                        className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: false, amount: 0.2 }}
                        layout={false}
                        variants={{
                            hidden: {},
                            show: {
                                transition: shouldReduceMotion
                                    ? { staggerChildren: 0 }
                                    : { staggerChildren: 0.06 },
                            },
                        }}
                    >
                        {stableMeasurementCards.map((card) => {
                            const Icon = card.icon;
                            const readings = card.readings(metrics);
                            const hasValue = card.isComplete(metrics);
                            const tone = toneFor(card.key, measurementStatuses, hasValue);

                            return (
                                <motion.article
                                    key={card.key}
                                    layout={false}
                                    variants={{
                                        hidden: shouldReduceMotion
                                            ? { opacity: 1, y: 0 }
                                            : { opacity: 0, y: 16 },
                                        show: {
                                            opacity: 1,
                                            y: 0,
                                            transition: shouldReduceMotion
                                                ? { duration: 0.01 }
                                                : { duration: 0.48, ease: "easeOut" },
                                        },
                                        exit: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 },
                                    }}
                                    transformTemplate={(_, generated) => `${generated} translateZ(0)`}
                                    className="relative cursor-default transform-gpu overflow-hidden rounded-[1.5rem] border p-5 shadow-sm"
                                    style={{
                                        backgroundColor: hasValue
                                            ? `color-mix(in srgb, ${tone.color} 6%, var(--color-card))`
                                            : "var(--color-card)",
                                        borderColor: hasValue
                                            ? `color-mix(in srgb, ${tone.color} 35%, var(--color-border))`
                                            : "var(--color-border)",
                                        willChange: "transform, opacity",
                                    }}
                                >
                                    {hasValue && <PulseBorder color={tone.color} />}
                                    <div className="relative z-10 flex items-start justify-between gap-4">
                                        <div
                                            className="flex h-12 w-12 items-center justify-center rounded-2xl"
                                            style={{ backgroundColor: "var(--color-surface)", color: "var(--color-primary)" }}
                                        >
                                            <Icon size={23} />
                                        </div>
                                        {tone.label ? (
                                            <span
                                                className="rounded-full px-3 py-1 text-xs font-black"
                                                style={{
                                                    backgroundColor: "var(--color-surface)",
                                                    color: tone.color,
                                                }}
                                            >
                                                {tone.label}
                                            </span>
                                        ) : null}
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
                </motion.section>
                    </div>
                </motion.main>
            )}
        </AnimatePresence>
    );
}
