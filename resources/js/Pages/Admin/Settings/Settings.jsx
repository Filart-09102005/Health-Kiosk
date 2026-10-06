import { motion } from "framer-motion";
import { Activity, Bell, Cpu, HeartPulse, Info, RotateCcw, Save, Settings as SettingsIcon, SlidersHorizontal, Thermometer, Weight } from "lucide-react";
import { useEffect, useState } from "react";
import { authService, getErrorMessage } from "../../Auth/services/authService";
import { useToast } from "../../Global/Toast";
import ConfirmDialog from "../../Global/ConfirmDialog";
import AdminShell from "../components/AdminShell";
import AdminModulePage from "../components/AdminModulePage";
import CustomSelectField from "../../../Global/CustomSelectField";
import MeasurementAvailabilitySection from "./components/MeasurementAvailabilitySection";
import { KEYBOARD_SETTING_CHANGED_EVENT } from "../../../Global/FloatingKeyboard/keyboardSettingEvent";
import {
    ALERTS_ENABLED_KEY,
    getAlertSensitivityProfile,
    getStoredAlertSensitivity,
    saveAlertsEnabled,
    saveAlertSensitivity,
} from "../Alerts/utils/alertSensitivity";

// Mirror of AdminSettings::defaults() in PHP - change both together.
// Temperature and heart rate are two-state by design: the alert bounds sit on
// the normal bounds, so no Watch grade is reachable for them.
const defaultThresholds = {
    temperature: { alertLow: 35, normalLow: 35, normalHigh: 37.2, alertHigh: 37.2 },
    heartRate: { alertLow: 60, normalLow: 60, normalHigh: 100, alertHigh: 100 },
    spo2: { alertLow: 91, normalLow: 95 },
    bmi: { underweightMax: 18.4, normalMax: 24.9, overweightMax: 29.9 },
    alertsEnabled: true,
    alertSensitivity: "Standard",
    platformOffsetCm: 2.0,
    kioskKeyboardEnabledAdmin: true,
    kioskKeyboardEnabledUser: true,
};

// Which keys belong to which section's save button.
const SECTIONS = {
    thresholds: { key: "thresholds", label: "Health thresholds", keys: ["temperature", "heartRate", "spo2", "bmi"] },
    alerts: { key: "alerts", label: "Alert settings", keys: ["alertsEnabled", "alertSensitivity"] },
    kiosk: { key: "kiosk", label: "Kiosk preferences", keys: ["platformOffsetCm", "kioskKeyboardEnabledAdmin", "kioskKeyboardEnabledUser"] },
};

export default function Settings({ navigate }) {
    const { showToast } = useToast();
    const [savingSection, setSavingSection] = useState(null);
    // Section awaiting confirmation before its values are reset.
    const [pendingRestore, setPendingRestore] = useState(null);
    const [settings, setSettings] = useState(() => ({
        ...defaultThresholds,
        alertsEnabled: window.localStorage.getItem(ALERTS_ENABLED_KEY) !== "false",
        alertSensitivity: getStoredAlertSensitivity(),
    }));

    useEffect(() => {
        let alive = true;

        authService.adminSettings()
            .then((response) => {
                if (alive && response.data?.settings) {
                    setSettings((current) => ({ ...current, ...response.data.settings }));
                }
            })
            .catch((error) => {
                if (!alive) return;

                showToast({
                    type: "error",
                    title: "Settings unavailable",
                    message: getErrorMessage(error, "Unable to load saved settings right now."),
                });
            });

        return () => {
            alive = false;
        };
    }, [showToast]);

    const updateGroup = (group, key, value) => {
        setSettings((current) => ({
            ...current,
            [group]: {
                ...current[group],
                [key]: value,
            },
        }));
    };

    const updateValue = (key, value) => {
        if (key === "alertsEnabled") {
            saveAlertsEnabled(value);
        }

        if (key === "alertSensitivity") {
            saveAlertSensitivity(value);
        }

        setSettings((current) => ({ ...current, [key]: value }));
    };

    // Each section saves only its own keys. The server merges a partial payload
    // over the settings already in force, so saving one section cannot disturb
    // another - which is what makes per-section buttons safe.
    const pick = (keys, source) => keys.reduce((acc, key) => ({ ...acc, [key]: source[key] }), {});

    const persist = (sectionKey, payload, label) => {
        setSavingSection(sectionKey);

        return authService.updateAdminSettings(payload)
            .then(() => {
                showToast({ type: "success", title: `${label} saved`, message: "The change is now in force." });

                // Lets every open tab/kiosk screen react right away instead of
                // only picking this up on their next reload.
                const hasAdminFlag = Object.prototype.hasOwnProperty.call(payload, "kioskKeyboardEnabledAdmin");
                const hasUserFlag = Object.prototype.hasOwnProperty.call(payload, "kioskKeyboardEnabledUser");

                if (hasAdminFlag || hasUserFlag) {
                    window.dispatchEvent(new CustomEvent(KEYBOARD_SETTING_CHANGED_EVENT, {
                        detail: {
                            ...(hasAdminFlag ? { admin: payload.kioskKeyboardEnabledAdmin } : {}),
                            ...(hasUserFlag ? { user: payload.kioskKeyboardEnabledUser } : {}),
                        },
                    }));
                }
            })
            .catch((error) => {
                showToast({
                    type: "error",
                    title: "Save failed",
                    message: getErrorMessage(error, "Unable to save settings right now."),
                });

                if (error?.response?.status === 401 || error?.response?.status === 403) {
                    navigate("/login");
                }
            })
            .finally(() => setSavingSection(null));
    };

    const saveSection = (section) => persist(section.key, pick(section.keys, settings), section.label);

    const confirmRestore = () => {
        const section = pendingRestore;
        if (!section) return undefined;

        setPendingRestore(null);

        const restored = pick(section.keys, defaultThresholds);

        // These two are mirrored in localStorage for the alert widgets, so the
        // local copy has to move with them.
        if (section.keys.includes("alertsEnabled")) saveAlertsEnabled(defaultThresholds.alertsEnabled);
        if (section.keys.includes("alertSensitivity")) saveAlertSensitivity(defaultThresholds.alertSensitivity);

        setSettings((current) => ({ ...current, ...restored }));

        return persist(section.key, restored, section.label);
    };

    const sensitivityProfile = getAlertSensitivityProfile(settings.alertSensitivity);

    return (
        <AdminShell navigate={navigate} eyebrow="System Settings" title="Admin Settings">
            <AdminModulePage
                icon={SettingsIcon}
                eyebrow="Admin configuration"
                title="System Settings"
                description="Configure editable health thresholds, alert behavior, and kiosk preferences."
                showHeaderActions={false}
            >
                <div className="space-y-6">
                    <SettingsSection
                        icon={HeartPulse}
                        title="Health Thresholds"
                        description="Admin can customize the values used to classify Normal, Needs Attention, and Alert records."
                    >
                        <ThresholdGuide />

                        <div className="mt-5 grid gap-5 xl:grid-cols-2">
                            <ThresholdPanel
                                icon={Thermometer}
                                title="Temperature Threshold"
                                description="Measured in Celsius."
                                accent="temperature"
                            >
                                <ThresholdRuleList>
                                    <ThresholdRuleInput status="Alert" operator="<" label="Below" value={settings.temperature.alertLow} onChange={(value) => updateGroup("temperature", "alertLow", value)} unit="C" tone="alert" />
                                    <ThresholdRangeInput status="Normal" from={settings.temperature.normalLow} to={settings.temperature.normalHigh} onFromChange={(value) => updateGroup("temperature", "normalLow", value)} onToChange={(value) => updateGroup("temperature", "normalHigh", value)} unit="C" />
                                    <ThresholdRuleInput status="Alert" operator=">" label="Above" value={settings.temperature.alertHigh} onChange={(value) => updateGroup("temperature", "alertHigh", value)} unit="C" tone="alert" />
                                </ThresholdRuleList>
                            </ThresholdPanel>

                            <ThresholdPanel
                                icon={HeartPulse}
                                title="Heart Rate Threshold"
                                description="Measured in beats per minute."
                                accent="heart"
                            >
                                <ThresholdRuleList>
                                    <ThresholdRuleInput status="Alert" operator="<" label="Below" value={settings.heartRate.alertLow} onChange={(value) => updateGroup("heartRate", "alertLow", value)} unit="bpm" tone="alert" />
                                    <ThresholdRangeInput status="Normal" from={settings.heartRate.normalLow} to={settings.heartRate.normalHigh} onFromChange={(value) => updateGroup("heartRate", "normalLow", value)} onToChange={(value) => updateGroup("heartRate", "normalHigh", value)} unit="bpm" />
                                    <ThresholdRuleInput status="Alert" operator=">" label="Above" value={settings.heartRate.alertHigh} onChange={(value) => updateGroup("heartRate", "alertHigh", value)} unit="bpm" tone="alert" />
                                </ThresholdRuleList>
                            </ThresholdPanel>

                            <ThresholdPanel
                                icon={Activity}
                                title="SpO2 Threshold"
                                description="SpO2 below alert low is Alert; below normal low is Needs Attention."
                                accent="spo2"
                            >
                                <ThresholdRuleList>
                                    <ThresholdRuleInput status="Alert" operator="<" label="Below" value={settings.spo2.alertLow} onChange={(value) => updateGroup("spo2", "alertLow", value)} unit="%" tone="alert" />
                                    <ThresholdRuleInput status="Normal" operator=">=" label="At least" value={settings.spo2.normalLow} onChange={(value) => updateGroup("spo2", "normalLow", value)} unit="%" tone="normal" />
                                    <ThresholdHint text={`Readings from ${settings.spo2.alertLow}% to below ${settings.spo2.normalLow}% are treated as Needs Attention.`} />
                                </ThresholdRuleList>
                            </ThresholdPanel>

                            <ThresholdPanel
                                icon={Weight}
                                title="BMI Classification Settings"
                                description="BMI categories used by HealthMetrics helpers."
                                accent="bmi"
                            >
                                <ThresholdRuleList>
                                    <ThresholdRuleInput status="Underweight" operator="<=" label="Up to" value={settings.bmi.underweightMax} onChange={(value) => updateGroup("bmi", "underweightMax", value)} unit="BMI" tone="watch" />
                                    <ThresholdRuleInput status="Normal max" operator="<=" label="Up to" value={settings.bmi.normalMax} onChange={(value) => updateGroup("bmi", "normalMax", value)} unit="BMI" tone="normal" />
                                    <ThresholdRuleInput status="Overweight max" operator="<=" label="Up to" value={settings.bmi.overweightMax} onChange={(value) => updateGroup("bmi", "overweightMax", value)} unit="BMI" tone="watch" />
                                    <ThresholdHint text={`BMI above ${settings.bmi.overweightMax} is classified as high risk.`} />
                                </ThresholdRuleList>
                            </ThresholdPanel>
                        </div>

                        <SectionActions
                            section={SECTIONS.thresholds}
                            onSave={saveSection}
                            onRestore={setPendingRestore}
                            saving={savingSection === SECTIONS.thresholds.key}
                        />
                    </SettingsSection>

                    {/* Saves on toggle through its own endpoint, so it needs no
                        button of its own. */}
                    <SettingsSection
                        icon={Cpu}
                        title="Measurement Availability"
                        description="Turn Smart Mode off for a sensor that is under maintenance or being calibrated. Manual Mode always stays available."
                    >
                        <MeasurementAvailabilitySection />
                    </SettingsSection>

                    <SettingsSection
                        icon={Bell}
                        title="Alert Settings"
                        description="Control whether abnormal readings appear in alert monitoring."
                    >
                        <div className="grid gap-5 lg:grid-cols-2">
                            <article className="flex min-h-[190px] rounded-[1.25rem] border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="font-black">Enable Alerts</p>
                                        <p className="mt-1 text-sm font-semibold leading-6" style={{ color: "var(--color-muted)" }}>
                                            When disabled, abnormal readings will not appear in the alert queue.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => updateValue("alertsEnabled", !settings.alertsEnabled)}
                                        className="relative h-8 w-14 rounded-full border transition"
                                        style={{
                                            backgroundColor: settings.alertsEnabled ? "var(--color-primary)" : "var(--color-border)",
                                            borderColor: "var(--color-border)",
                                        }}
                                    >
                                        <span
                                            className="absolute top-1 h-6 w-6 rounded-full bg-white transition"
                                            style={{ left: settings.alertsEnabled ? "1.75rem" : "0.25rem" }}
                                        />
                                    </button>
                                </div>
                            </article>

                            <article className="rounded-[1.25rem] border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                                {/* Was the last native <select> in the admin. */}
                                <CustomSelectField
                                    label="Alert Sensitivity"
                                    value={settings.alertSensitivity}
                                    onChange={(value) => updateValue("alertSensitivity", value)}
                                    options={[
                                        { value: "Low", label: "Low" },
                                        { value: "Standard", label: "Standard" },
                                        { value: "High", label: "High" },
                                    ]}
                                />
                                <p className="mt-3 text-xs font-semibold leading-5" style={{ color: "var(--color-muted)" }}>
                                    {sensitivityProfile.description}
                                </p>
                                <div className="mt-4 rounded-xl border p-3" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--color-muted)" }}>Detection Rate</span>
                                        <span className="text-xl font-black" style={{ color: sensitivityProfile.queueRate === 100 ? "var(--color-success)" : sensitivityProfile.queueRate >= 80 ? "var(--color-primary)" : "var(--color-error)" }}>
                                            {sensitivityProfile.queueRate}%
                                        </span>
                                    </div>
                                    <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-surface)" }}>
                                        <div className="h-full rounded-full transition-all" style={{ width: `${sensitivityProfile.queueRate}%`, backgroundColor: sensitivityProfile.queueRate === 100 ? "var(--color-success)" : sensitivityProfile.queueRate >= 80 ? "var(--color-primary)" : "var(--color-error)" }} />
                                    </div>
                                    <p className="mt-3 text-xs font-bold leading-5" style={{ color: "var(--color-muted)" }}>
                                        {sensitivityProfile.delayDetail}
                                    </p>
                                </div>
                            </article>
                        </div>

                        <SectionActions
                            section={SECTIONS.alerts}
                            onSave={saveSection}
                            onRestore={setPendingRestore}
                            saving={savingSection === SECTIONS.alerts.key}
                        />
                    </SettingsSection>

                    <SettingsSection
                        icon={SlidersHorizontal}
                        title="Kiosk Preferences"
                        description="Configure physical kiosk offsets."
                    >
                        <div className="grid gap-5 lg:grid-cols-2">
                            <article className="rounded-[1.25rem] border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                                <ThresholdInput
                                    label="Platform Height Deduction (cm)"
                                    value={settings.platformOffsetCm}
                                    onChange={(value) => updateValue("platformOffsetCm", value)}
                                    helper="The physical thickness of the floor platform used for height checks. This value is subtracted from the raw LiDAR reading to compute the final standing height."
                                />
                            </article>

                            <ToggleCard
                                title="Floating Keyboard — Admin Side"
                                description="Applies to the admin console (dashboard, users, reports, this settings screen). Turn off on a back-office desk that already has a real keyboard."
                                enabled={settings.kioskKeyboardEnabledAdmin}
                                onToggle={() => updateValue("kioskKeyboardEnabledAdmin", !settings.kioskKeyboardEnabledAdmin)}
                            />

                            <ToggleCard
                                title="Floating Keyboard — User Side"
                                description="Applies to the kiosk screens (login, register, measurements). Turn on for a touchscreen station with no physical keyboard attached."
                                enabled={settings.kioskKeyboardEnabledUser}
                                onToggle={() => updateValue("kioskKeyboardEnabledUser", !settings.kioskKeyboardEnabledUser)}
                            />
                        </div>

                        <SectionActions
                            section={SECTIONS.kiosk}
                            onSave={saveSection}
                            onRestore={setPendingRestore}
                            saving={savingSection === SECTIONS.kiosk.key}
                        />
                    </SettingsSection>
                </div>
            </AdminModulePage>

            <ConfirmDialog
                open={pendingRestore !== null}
                title={`Restore ${(pendingRestore?.label || "these settings").toLowerCase()} to defaults?`}
                message={
                    pendingRestore
                        ? `This replaces the current ${pendingRestore.label.toLowerCase()} with the shipped defaults and saves immediately. Readings are graded against these values, so the change takes effect straight away. Other sections are not affected.`
                        : ""
                }
                confirmLabel="Restore Defaults"
                cancelLabel="Cancel"
                loading={savingSection !== null}
                onConfirm={confirmRestore}
                onCancel={() => setPendingRestore(null)}
            />
        </AdminShell>
    );
}

const SECTION_EASE = [0.16, 1, 0.3, 1];

/**
 * Explains how the three bands relate before the admin starts editing numbers.
 * Without it the panels below are just pairs of inputs with no stated meaning —
 * which is fine once you know the model and opaque until then.
 */
function ThresholdGuide() {
    const bands = [
        { tone: "alert", label: "Alert", detail: "Outside the safe band. Raises a health alert for clinic review." },
        { tone: "normal", label: "Normal", detail: "Inside the expected range. No action needed." },
        { tone: "watch", label: "Needs attention", detail: "Between normal and alert. Flagged but not escalated." },
    ];

    return (
        <div
            className="rounded-[1.25rem] border p-5"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
            <div className="flex items-start gap-3">
                <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, transparent)", color: "var(--color-primary)" }}
                >
                    <Info size={17} />
                </span>
                <div className="min-w-0">
                    <p className="text-sm font-black" style={{ color: "var(--color-text)" }}>How thresholds work</p>
                    <p className="mt-1 text-xs font-medium leading-5" style={{ color: "var(--color-muted)" }}>
                        Each measurement is sorted into one of three bands the moment it is saved. Set the
                        boundaries below — every reading outside the normal range becomes an alert on the
                        Health Alerts screen.
                    </p>
                </div>
            </div>

            {/* Visual band strip, so the ordering is obvious before reading. */}
            <div className="mt-4 flex h-2 overflow-hidden rounded-full">
                <span className="flex-1" style={{ backgroundColor: statusColor("alert") }} />
                <span className="flex-[2]" style={{ backgroundColor: statusColor("normal") }} />
                <span className="flex-1" style={{ backgroundColor: statusColor("alert") }} />
            </div>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                {bands.map((band) => (
                    <div key={band.label} className="flex items-start gap-2">
                        <span
                            aria-hidden="true"
                            className="mt-1 h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: statusColor(band.tone) }}
                        />
                        <div className="min-w-0">
                            <p className="text-xs font-black" style={{ color: statusColor(band.tone) }}>{band.label}</p>
                            <p className="mt-0.5 text-[0.7rem] font-medium leading-4" style={{ color: "var(--color-muted)" }}>
                                {band.detail}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Save / restore pair belonging to one settings section. */
function SectionActions({ section, onSave, onRestore, saving }) {
    return (
        <div
            className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t pt-5"
            style={{ borderColor: "var(--color-border)" }}
        >
            <button
                type="button"
                onClick={() => onRestore(section)}
                disabled={saving}
                className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-4 text-sm font-black transition hk-admin-nav-hover disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
            >
                <RotateCcw size={17} />
                Restore Defaults
            </button>
            <button
                type="button"
                onClick={() => onSave(section)}
                disabled={saving}
                className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-black transition hk-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
                style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-content)" }}
            >
                <Save size={17} />
                {saving ? "Saving..." : `Save ${section.label}`}
            </button>
        </div>
    );
}

function SettingsSection({ icon: Icon, title, description, children }) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.42, ease: SECTION_EASE }}
            className="relative overflow-hidden rounded-[1.5rem] border p-6 hk-admin-card"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
            {/* Quiet accent wash so each section reads as its own surface
                rather than one more identical panel in a long column. */}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-14 -top-20 h-44 w-44 rounded-full"
                style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--color-primary) 10%, transparent), transparent 70%)" }}
            />

            <div className="relative flex items-start gap-4 border-b pb-5" style={{ borderColor: "var(--color-border)" }}>
                <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                    style={{
                        backgroundColor: "color-mix(in srgb, var(--color-primary) 11%, transparent)",
                        color: "var(--color-primary)",
                    }}
                >
                    <Icon size={22} />
                </div>
                <div className="min-w-0">
                    <h3 className="text-xl font-black tracking-tight">{title}</h3>
                    <p className="mt-1 text-sm font-medium leading-6" style={{ color: "var(--color-muted)" }}>{description}</p>
                </div>
            </div>
            <div className="relative mt-6">{children}</div>
        </motion.section>
    );
}

function ThresholdPanel({ icon: Icon, title, description, accent, children }) {
    const tone = accentColor(accent);

    return (
        <motion.article
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.36, ease: SECTION_EASE }}
            whileHover={{ y: -2 }}
            className="relative flex h-full flex-col overflow-hidden rounded-[1.25rem] border p-5 transition-shadow"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
            {/* Top edge in the panel's own accent — the fastest way to tell
                these apart at a glance. */}
            <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: tone }} />

            <div className="flex items-start gap-3.5">
                <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `color-mix(in srgb, ${tone} 13%, transparent)`, color: tone }}
                >
                    <Icon size={20} />
                </div>
                <div className="min-w-0">
                    <h4 className="text-base font-black tracking-tight">{title}</h4>
                    <p className="mt-1 text-sm font-medium leading-6" style={{ color: "var(--color-muted)" }}>{description}</p>
                </div>
            </div>
            <div className="mt-6 flex flex-1 flex-col justify-end">{children}</div>
        </motion.article>
    );
}

/**
 * Rules now stack as one continuous list with hairline dividers instead of
 * three separate bordered cards. Each rule reads on a single line — status,
 * plain-English condition, then the input — so a panel can be scanned top to
 * bottom rather than parsed card by card.
 */
function ThresholdRuleList({ children }) {
    return (
        <div
            className="divide-y overflow-hidden rounded-[1rem] border"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
            {children}
        </div>
    );
}

function ThresholdRuleInput({ status, operator, label, value, onChange, unit, tone = "watch" }) {
    const color = statusColor(tone);

    return (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3.5" style={{ borderColor: "var(--color-border)" }}>
            <span className="flex min-w-0 flex-1 items-center gap-2.5">
                <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                <span className="truncate text-xs font-black uppercase tracking-[0.1em]" style={{ color }}>
                    {status}
                </span>
                <span className="truncate text-xs font-semibold" style={{ color: "var(--color-muted)" }}>
                    {label.toLowerCase()}
                </span>
            </span>

            <span className="flex shrink-0 items-center gap-2">
                <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black"
                    style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`, color }}
                >
                    {operator}
                </span>
                <input
                    type="number"
                    value={value}
                    placeholder="0"
                    aria-label={`${status} threshold: ${label} ${operator}`}
                    onChange={(event) => onChange(event.target.value)}
                    className="h-10 w-24 rounded-xl border px-3 text-sm font-black tabular-nums outline-none transition focus:ring-2"
                    style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                />
                <span className="w-8 text-xs font-black" style={{ color: "var(--color-muted)" }}>{unit}</span>
            </span>
        </div>
    );
}

function ThresholdRangeInput({ status, from, to, onFromChange, onToChange, unit }) {
    const color = statusColor("normal");

    return (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3.5" style={{ borderColor: "var(--color-border)" }}>
            <span className="flex min-w-0 flex-1 items-center gap-2.5">
                <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                <span className="truncate text-xs font-black uppercase tracking-[0.1em]" style={{ color }}>
                    {status}
                </span>
                <span className="truncate text-xs font-semibold" style={{ color: "var(--color-muted)" }}>
                    between
                </span>
            </span>

            <span className="flex shrink-0 items-center gap-2">
                <NumberField value={from} onChange={onFromChange} ariaLabel={`${status} range from`} />
                <span className="text-xs font-black" style={{ color: "var(--color-muted)" }}>to</span>
                <NumberField value={to} onChange={onToChange} ariaLabel={`${status} range to`} />
                <span className="w-8 text-xs font-black" style={{ color: "var(--color-muted)" }}>{unit}</span>
            </span>
        </div>
    );
}

function NumberField({ value, onChange, ariaLabel }) {
    return (
        <input
            type="number"
            value={value}
            placeholder="0"
            aria-label={ariaLabel}
            onChange={(event) => onChange(event.target.value)}
            className="h-10 w-20 rounded-xl border px-3 text-sm font-black tabular-nums outline-none transition focus:ring-2"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
        />
    );
}

function ThresholdHint({ text }) {
    return (
        <p
            className="mt-3 flex items-start gap-2 rounded-[1rem] px-4 py-3 text-xs font-semibold leading-5"
            style={{ backgroundColor: "var(--color-card)", color: "var(--color-muted)" }}
        >
            <Info size={14} className="mt-0.5 shrink-0" style={{ color: "var(--color-primary)" }} />
            {text}
        </p>
    );
}

/** The same on/off switch card used for both keyboard toggles (and matches
 * the "Enable Alerts" toggle above) - only the label, copy, and the value it
 * reads/flips differ. */
function ToggleCard({ title, description, enabled, onToggle }) {
    return (
        <article className="flex min-h-[190px] rounded-[1.25rem] border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="font-black">{title}</p>
                    <p className="mt-1 text-sm font-semibold leading-6" style={{ color: "var(--color-muted)" }}>
                        {description}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onToggle}
                    className="relative h-8 w-14 shrink-0 rounded-full border transition"
                    style={{
                        backgroundColor: enabled ? "var(--color-primary)" : "var(--color-border)",
                        borderColor: "var(--color-border)",
                    }}
                    aria-label={enabled ? `Turn off ${title}` : `Turn on ${title}`}
                >
                    <span
                        className="absolute top-1 h-6 w-6 rounded-full bg-white transition"
                        style={{ left: enabled ? "1.75rem" : "0.25rem" }}
                    />
                </button>
            </div>
        </article>
    );
}

function ThresholdInput({ label, value, onChange, helper }) {
    return (
        <label className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--color-muted)" }}>
            {label}
            <input
                type="number"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-2 h-12 w-full rounded-xl border px-4 text-sm font-black outline-none"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
            />
            {helper ? <p className="mt-3 text-xs font-semibold leading-5 normal-case tracking-normal" style={{ color: "var(--color-muted)" }}>{helper}</p> : null}
        </label>
    );
}

function statusColor(tone) {
    if (tone === "alert") return "var(--color-error)";
    if (tone === "normal") return "var(--color-success)";
    return "var(--color-primary)";
}

function accentColor(accent) {
    if (accent === "temperature") return "var(--color-error)";
    if (accent === "heart") return "var(--color-primary)";
    if (accent === "spo2") return "var(--color-success)";
    if (accent === "bmi") return "#a78bfa";
    return "var(--color-primary)";
}
