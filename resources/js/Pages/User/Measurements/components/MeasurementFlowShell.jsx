import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Gauge, RotateCcw, Save } from "lucide-react";
import useMeasurementSimulation from "../hooks/useMeasurementSimulation";
import { measurementService } from "../services/measurementService";
import { useAssistant } from "../../AI-Assistant/context/AssistantProvider";

const flowSteps = ["Instructions", "Positioning", "Reading", "Result", "Save"];
const fallbackConfig = {
    type: "measurement",
    icon: Gauge,
    title: "Measurement",
    description: "",
    instructions: "",
    positioning: "",
    sensor: "",
    unit: "",
    format: () => "--",
};

export default function MeasurementFlowShell({ config, onBack, onSaved, showToast }) {
    const safeConfig = config ?? fallbackConfig;
    const { enabled: assistantEnabled, speak } = useAssistant();
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const spokenStepRef = useRef(null);
    const isReading = step === 2;
    const reading = useMeasurementSimulation(safeConfig.type, isReading);
    const Icon = safeConfig.icon;

    useEffect(() => {
        if (step !== 2 || ! reading.stabilized) {
            return;
        }

        const timer = window.setTimeout(() => {
            setStep(3);
        }, 1200);

        return () => window.clearTimeout(timer);
    }, [reading.stabilized, step]);

    const save = async () => {
        setSaving(true);

        try {
            const response = await measurementService.save({
                type: safeConfig.type,
                value: reading.value,
                secondary_value: reading.secondaryValue,
                unit: safeConfig.unit,
                metadata: {
                    simulated: true,
                    sensor: safeConfig.sensor,
                },
            });

            showToast?.({
                type: "success",
                title: "Measurement saved",
                message: `${safeConfig.title} was saved to this kiosk session.`,
            });
            const record = response?.data?.record;
            if (record) {
                onSaved?.(record, safeConfig.title);
            }
        } catch (error) {
            showToast?.({
                type: "error",
                title: "Unable to save",
                message: error?.response?.data?.message || "Please try again.",
            });
        } finally {
            setSaving(false);
        }
    };

    const primaryValue = useMemo(
        () => safeConfig.format(reading.value, reading.secondaryValue),
        [reading.secondaryValue, reading.value, safeConfig],
    );

    useEffect(() => {
        if (!config) return;

        const spokenKey = `${safeConfig.type}-${step}`;
        if (spokenStepRef.current === spokenKey) return;

        const stepGuidance = [
            `${safeConfig.title} instructions. ${safeConfig.instructions} Press Continue when you are ready.`,
            `${safeConfig.title} positioning. ${safeConfig.positioning} Press Continue to start reading.`,
            `${safeConfig.title} reading started. Please stay still while the kiosk captures your measurement.`,
            `${safeConfig.title} result is ${primaryValue}. Review the reading, then press Continue to save it.`,
            `Save ${safeConfig.title}. Press Confirm and Save to store this reading for your health results.`,
        ];

        spokenStepRef.current = spokenKey;
        speak(stepGuidance[step]);
    }, [config, primaryValue, safeConfig.instructions, safeConfig.positioning, safeConfig.title, speak, step]);

    if (! config) {
        return null;
    }

    return (
        <section className="overflow-hidden rounded-[1.75rem] border shadow-xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="border-b p-5 md:p-6" style={{ borderColor: "var(--color-border)", backgroundColor: "color-mix(in srgb, var(--color-surface) 62%, transparent)" }}>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <button type="button" onClick={onBack} className="flex items-center gap-2 self-start rounded-2xl border px-4 py-3 text-sm font-black transition hk-soft-hover" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                        <ArrowLeft size={17} />
                        All measurements
                    </button>

                    <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2 rounded-3xl border p-2" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                        {flowSteps.map((label, index) => {
                            const complete = index < step;
                            const active = index === step;

                            return (
                                <div
                                    key={label}
                                    className={`flex items-center gap-2 rounded-2xl px-2 py-1 ${assistantEnabled && active ? "hk-step-assist-hint" : ""}`}
                                    style={{ backgroundColor: active ? "color-mix(in srgb, var(--color-primary) 10%, transparent)" : "transparent" }}
                                >
                                    <span
                                        className="flex h-8 w-8 items-center justify-center rounded-full border text-xs font-black"
                                        style={{
                                            backgroundColor: complete ? "var(--color-success)" : active ? "var(--color-primary)" : "var(--color-card)",
                                            borderColor: complete ? "var(--color-success)" : active ? "var(--color-primary)" : "var(--color-border)",
                                            color: complete || active ? "#ffffff" : "var(--color-muted)",
                                        }}
                                    >
                                        {complete ? <Check size={15} /> : index + 1}
                                    </span>
                                    <span className="hidden text-xs font-black uppercase tracking-[0.08em] sm:inline" style={{ color: active ? "var(--color-text)" : "var(--color-muted)" }}>
                                        {label}
                                    </span>
                                    {index < flowSteps.length - 1 ? <span className="hidden h-px w-7 md:block" style={{ backgroundColor: "var(--color-border)" }} /> : null}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    className="grid gap-0 lg:grid-cols-[24rem_1fr]"
                >
                    <aside className="border-b p-6 md:p-8 lg:border-b-0 lg:border-r" style={{ background: "linear-gradient(180deg, color-mix(in srgb, var(--color-primary) 7%, var(--color-surface)), var(--color-surface))", borderColor: "var(--color-border)" }}>
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg" style={{ backgroundColor: "var(--color-primary)" }}>
                                <Icon size={30} />
                            </div>
                            <span className="rounded-full px-3 py-1 text-xs font-black" style={{ backgroundColor: "var(--color-card)", color: "var(--color-muted)" }}>
                                Step {step + 1}/5
                            </span>
                        </div>
                        <h2 className="mt-5 text-3xl font-black">{safeConfig.title}</h2>
                        <p className="mt-3 text-sm leading-7" style={{ color: "var(--color-muted)" }}>
                            {safeConfig.description}
                        </p>

                        <div className="mt-6 grid gap-3">
                            <InfoRow label="Sensor" value={safeConfig.sensor} />
                            <InfoRow label="Current stage" value={flowSteps[step]} />
                        </div>
                    </aside>

                    <article className="p-6 md:p-8">
                        <div className="min-h-[360px] rounded-[1.5rem] border p-6 shadow-sm md:p-8" style={{ backgroundColor: "color-mix(in srgb, var(--color-card) 94%, var(--color-surface))", borderColor: "var(--color-border)" }}>
                            {step === 0 ? (
                                <Panel eyebrow="Instruction screen" title="Prepare for measurement" body={safeConfig.instructions} icon={Icon} type={safeConfig.type} />
                            ) : null}
                            {step === 1 ? (
                                <Panel eyebrow="Positioning guidance" title="Get into position" body={safeConfig.positioning} icon={Gauge} type={safeConfig.type} />
                            ) : null}
                            {step === 2 ? (
                                <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                                    <div className="relative flex h-40 w-40 items-center justify-center">
                                        <div className="absolute inset-0 animate-ping rounded-full" style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 18%, transparent)" }} />
                                        <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-8" style={{ borderColor: reading.stabilized ? "var(--color-success)" : "var(--color-primary)", backgroundColor: "var(--color-surface)" }}>
                                            <Icon size={38} style={{ color: reading.stabilized ? "var(--color-success)" : "var(--color-primary)" }} />
                                        </div>
                                    </div>
                                    <p className="mt-6 text-sm font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-muted)" }}>
                                        {reading.stabilized ? "Measurement successful" : "Stabilizing reading"}
                                    </p>
                                    <div className="mt-3 text-5xl font-black tracking-tight md:text-6xl">{primaryValue}</div>
                                    <p className="mt-4 max-w-md text-sm leading-6" style={{ color: reading.stabilized ? "var(--color-success)" : "var(--color-muted)" }}>
                                        {reading.stabilized ? "Reading stabilized. Showing your result..." : "Hold position. The kiosk is averaging sensor values."}
                                    </p>
                                </div>
                            ) : null}
                            {step === 3 ? (
                                <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                                    <CheckCircle2 className="mx-auto" size={54} style={{ color: "var(--color-success)" }} />
                                    <p className="mt-6 text-sm font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-muted)" }}>Final result</p>
                                    <div className="mt-3 text-5xl font-black tracking-tight md:text-6xl">{primaryValue}</div>
                                    <p className="mt-4 text-sm" style={{ color: "var(--color-muted)" }}>
                                        If this looks wrong, go back and retake before saving.
                                    </p>
                                </div>
                            ) : null}
                            {step === 4 ? (
                                <Panel eyebrow="Save measurement" title="Save this reading" body="This latest successful reading will become the final value for this session. Previous retries stay in the activity timeline." icon={Save} type={safeConfig.type} />
                            ) : null}
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => (step === 0 ? onBack() : setStep((current) => Math.max(0, current - 1)))}
                                className="flex items-center justify-center gap-2 rounded-2xl border px-4 py-4 text-sm font-black transition hk-soft-hover"
                                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
                            >
                                <RotateCcw size={17} />
                                Back
                            </button>
                            {step === 2 ? (
                                <div
                                    className="flex items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-black"
                                    style={{
                                        backgroundColor: reading.stabilized ? "color-mix(in srgb, var(--color-success) 12%, var(--color-surface))" : "var(--color-surface)",
                                        color: reading.stabilized ? "var(--color-success)" : "var(--color-muted)",
                                    }}
                                >
                                    {reading.stabilized ? <CheckCircle2 size={17} /> : <Gauge size={17} />}
                                    {reading.stabilized ? "Success. Opening result..." : "Reading in progress"}
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => (step === 4 ? save() : setStep((current) => Math.min(flowSteps.length - 1, current + 1)))}
                                    className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-black text-white transition hk-primary-hover disabled:cursor-not-allowed disabled:opacity-70 ${assistantEnabled ? "hk-flow-action-hint" : ""}`}
                                    style={{ backgroundColor: "var(--color-primary)" }}
                                >
                                    {step === 4 ? saving ? "Saving..." : "Confirm & Save" : "Continue"}
                                    {step === 4 ? <Save size={17} /> : null}
                                    {step !== 4 ? <ArrowRight size={17} /> : null}
                                </button>
                            )}
                        </div>
                    </article>
                </motion.div>
            </AnimatePresence>
        </section>
    );
}

function InfoRow({ label, value }) {
    return (
        <div className="rounded-2xl border p-4" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--color-muted)" }}>{label}</p>
            <p className="mt-1 font-black">{value}</p>
        </div>
    );
}

function Panel({ eyebrow, title, body, icon: Icon, type }) {
    return (
        <div className="grid min-h-[300px] items-center gap-8 lg:grid-cols-[1fr_16rem]">
            <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, var(--color-surface))", color: "var(--color-primary)" }}>
                    <Icon size={28} />
                </div>
                <p className="mt-6 text-sm font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-primary)" }}>
                    {eyebrow}
                </p>
                <h3 className="mt-3 text-3xl font-black">{title}</h3>
                <p className="mt-4 max-w-2xl text-base leading-8" style={{ color: "var(--color-muted)" }}>
                    {body}
                </p>
            </div>
            <MeasurementIllustration type={type} />
        </div>
    );
}

function MeasurementIllustration({ type }) {
    const accent = "var(--color-primary)";
    const sensorLabel = {
        heart_rate: "SpO2",
        temperature: "TEMP",
        height: "CM",
        weight: "KG",
    }[type] || "SENSOR";

    return (
        <div className="mx-auto w-full max-w-[17rem] rounded-[1.5rem] border p-4 shadow-sm" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }} aria-hidden="true">
            <svg viewBox="0 0 240 280" className="h-auto w-full" role="img">
                <defs>
                    <linearGradient id={`kioskGradient-${type}`} x1="44" x2="196" y1="28" y2="250" gradientUnits="userSpaceOnUse">
                        <stop stopColor="var(--color-card)" />
                        <stop offset="1" stopColor="color-mix(in srgb, var(--color-primary) 12%, var(--color-card))" />
                    </linearGradient>
                </defs>
                <rect x="32" y="18" width="176" height="244" rx="34" fill={`url(#kioskGradient-${type})`} stroke="var(--color-border)" />
                <rect x="54" y="38" width="132" height="82" rx="22" fill="var(--color-card)" stroke="var(--color-border)" />
                <circle cx="120" cy="77" r="24" fill="color-mix(in srgb, var(--color-primary) 18%, var(--color-card))" />
                <path d="M98 151c5-31 39-38 54-14 7 11 9 27 11 49H82c2-17 6-28 16-35z" fill="color-mix(in srgb, var(--color-primary) 16%, var(--color-card))" stroke="var(--color-border)" />
                <path d="M84 166c-18 15-23 33-17 54" fill="none" stroke={accent} strokeWidth="8" strokeLinecap="round" />
                <path d="M156 166c18 15 23 33 17 54" fill="none" stroke={accent} strokeWidth="8" strokeLinecap="round" />
                <rect x="72" y="218" width="96" height="26" rx="13" fill={accent} opacity="0.96" />
                <text x="120" y="235" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="900">{sensorLabel}</text>
                {type === "height" ? (
                    <>
                        <path d="M193 48v178" stroke={accent} strokeWidth="6" strokeLinecap="round" />
                        <path d="M181 48h24M181 226h24" stroke={accent} strokeWidth="6" strokeLinecap="round" />
                        <path d="M120 126v86" stroke="var(--color-muted)" strokeWidth="5" strokeLinecap="round" opacity="0.35" />
                    </>
                ) : null}
                {type === "temperature" ? (
                    <>
                        <path d="M174 72c23 9 24 40 0 52" fill="none" stroke={accent} strokeWidth="7" strokeLinecap="round" />
                        <circle cx="178" cy="96" r="8" fill="var(--color-error)" opacity="0.72" />
                    </>
                ) : null}
                {type === "heart_rate" ? (
                    <>
                        <path d="M78 91h20l10-17 19 36 12-20h23" fill="none" stroke={accent} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
                        <rect x="145" y="190" width="48" height="40" rx="15" fill="var(--color-card)" stroke={accent} strokeWidth="5" />
                        <path d="M139 210h-26c-11 0-19-8-19-19v-13" fill="none" stroke="var(--color-muted)" strokeWidth="7" strokeLinecap="round" opacity="0.55" />
                        <path d="M153 211h31" stroke={accent} strokeWidth="7" strokeLinecap="round" />
                    </>
                ) : null}
                {type === "weight" ? (
                    <>
                        <rect x="58" y="246" width="124" height="14" rx="7" fill="var(--color-success)" />
                        <path d="M92 252c5-12 51-12 56 0" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.75" />
                    </>
                ) : null}
            </svg>
        </div>
    );
}
