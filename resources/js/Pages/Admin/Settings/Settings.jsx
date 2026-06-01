import { Activity, Bell, Clock, HeartPulse, RotateCcw, Save, Settings as SettingsIcon, SlidersHorizontal, Thermometer, Weight } from "lucide-react";
import { useEffect, useState } from "react";
import AdminShell from "../components/AdminShell";
import AdminModulePage from "../components/AdminModulePage";
import {
    ALERTS_ENABLED_KEY,
    getAlertSensitivityProfile,
    getStoredAlertSensitivity,
    saveAlertsEnabled,
    saveAlertSensitivity,
} from "../Alerts/utils/alertSensitivity";

const defaultThresholds = {
    temperature: { alertLow: 35, normalLow: 36.1, normalHigh: 37.2, alertHigh: 37.5 },
    heartRate: { alertLow: 60, normalLow: 65, normalHigh: 90, alertHigh: 100 },
    spo2: { alertLow: 95, normalLow: 97 },
    bmi: { underweightMax: 18.4, normalMax: 24.9, overweightMax: 29.9 },
    alertsEnabled: true,
    alertSensitivity: "Standard",
    kioskMaintenanceHours: 2,
};

const MAINTENANCE_KEY = "healthKioskMaintenanceUntil";

export default function Settings({ navigate }) {
    const [settings, setSettings] = useState(() => ({
        ...defaultThresholds,
        alertsEnabled: window.localStorage.getItem(ALERTS_ENABLED_KEY) !== "false",
        alertSensitivity: getStoredAlertSensitivity(),
    }));
    const [now, setNow] = useState(Date.now());
    const [maintenanceUntil, setMaintenanceUntil] = useState(() => Number(window.localStorage.getItem(MAINTENANCE_KEY) || 0));

    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 1000);

        return () => window.clearInterval(timer);
    }, []);

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

    const restoreDefaults = () => {
        saveAlertsEnabled(defaultThresholds.alertsEnabled);
        saveAlertSensitivity(defaultThresholds.alertSensitivity);
        setSettings({
            ...defaultThresholds,
            alertsEnabled: defaultThresholds.alertsEnabled,
            alertSensitivity: defaultThresholds.alertSensitivity,
        });
    };

    const startMaintenance = () => {
        const hours = Math.max(0.1, Number(settings.kioskMaintenanceHours) || 0);
        const until = Date.now() + hours * 60 * 60 * 1000;

        window.localStorage.setItem(MAINTENANCE_KEY, String(until));
        window.dispatchEvent(new Event("health-kiosk-maintenance-change"));
        setMaintenanceUntil(until);
        setNow(Date.now());
    };

    const cancelMaintenance = () => {
        window.localStorage.removeItem(MAINTENANCE_KEY);
        window.dispatchEvent(new Event("health-kiosk-maintenance-change"));
        setMaintenanceUntil(0);
        setNow(Date.now());
    };

    const maintenanceActive = maintenanceUntil > now;
    const sensitivityProfile = getAlertSensitivityProfile(settings.alertSensitivity);

    return (
        <AdminShell navigate={navigate} eyebrow="System Settings" title="Admin Settings">
            <AdminModulePage
                icon={SettingsIcon}
                eyebrow="Admin configuration"
                title="System Settings"
                description="Configure editable health thresholds, alert behavior, and kiosk preferences."
                stats={[
                    { label: "Temperature Alert", value: `${settings.temperature.alertHigh}C`, caption: "High threshold", icon: Thermometer },
                    { label: "Heart Rate Alert", value: `${settings.heartRate.alertHigh} bpm`, caption: "High threshold", icon: HeartPulse },
                    { label: "SpO2 Alert", value: `< ${settings.spo2.alertLow}%`, caption: "Low oxygen threshold", icon: Activity },
                    { label: "BMI High", value: `> ${settings.bmi.overweightMax}`, caption: "Obese category begins", icon: Weight },
                ]}
            >
                <SettingsSection
                    icon={HeartPulse}
                    title="Health Thresholds"
                    description="Admin can customize the values used to classify Normal, Needs Attention, and Alert records."
                >
                    <div className="grid gap-4 xl:grid-cols-2">
                        <ThresholdPanel
                            icon={Thermometer}
                            title="Temperature Threshold"
                            description="Alert outside alert range; Needs Attention outside normal range."
                            accent="temperature"
                        >
                            <SegmentBar segments={["alert", "normal", "watch"]} />
                            <InputGrid>
                                <ThresholdInput label="Alert Low" value={settings.temperature.alertLow} onChange={(value) => updateGroup("temperature", "alertLow", value)} />
                                <ThresholdInput label="Normal Low" value={settings.temperature.normalLow} onChange={(value) => updateGroup("temperature", "normalLow", value)} />
                                <ThresholdInput label="Normal High" value={settings.temperature.normalHigh} onChange={(value) => updateGroup("temperature", "normalHigh", value)} />
                                <ThresholdInput label="Alert High" value={settings.temperature.alertHigh} onChange={(value) => updateGroup("temperature", "alertHigh", value)} />
                            </InputGrid>
                        </ThresholdPanel>

                        <ThresholdPanel
                            icon={HeartPulse}
                            title="Heart Rate Threshold"
                            description="Measured in beats per minute."
                            accent="heart"
                        >
                            <SegmentBar segments={["alert", "normal", "watch"]} />
                            <InputGrid>
                                <ThresholdInput label="Alert Low" value={settings.heartRate.alertLow} onChange={(value) => updateGroup("heartRate", "alertLow", value)} />
                                <ThresholdInput label="Normal Low" value={settings.heartRate.normalLow} onChange={(value) => updateGroup("heartRate", "normalLow", value)} />
                                <ThresholdInput label="Normal High" value={settings.heartRate.normalHigh} onChange={(value) => updateGroup("heartRate", "normalHigh", value)} />
                                <ThresholdInput label="Alert High" value={settings.heartRate.alertHigh} onChange={(value) => updateGroup("heartRate", "alertHigh", value)} />
                            </InputGrid>
                        </ThresholdPanel>

                        <ThresholdPanel
                            icon={Activity}
                            title="SpO2 Threshold"
                            description="SpO2 below alert low is Alert; below normal low is Needs Attention."
                            accent="spo2"
                        >
                            <SegmentBar segments={["alert", "normal"]} />
                            <InputGrid>
                                <ThresholdInput label="Alert Low" value={settings.spo2.alertLow} onChange={(value) => updateGroup("spo2", "alertLow", value)} />
                                <ThresholdInput label="Normal Low" value={settings.spo2.normalLow} onChange={(value) => updateGroup("spo2", "normalLow", value)} />
                            </InputGrid>
                        </ThresholdPanel>

                        <ThresholdPanel
                            icon={Weight}
                            title="BMI Classification Settings"
                            description="BMI categories used by HealthMetrics helpers."
                            accent="bmi"
                        >
                            <SegmentBar segments={["under", "normal", "over", "high"]} labels={["Under", "Normal", "Over", "High"]} />
                            <InputGrid>
                                <ThresholdInput label="Underweight Max" value={settings.bmi.underweightMax} onChange={(value) => updateGroup("bmi", "underweightMax", value)} />
                                <ThresholdInput label="Normal Max" value={settings.bmi.normalMax} onChange={(value) => updateGroup("bmi", "normalMax", value)} />
                                <ThresholdInput label="Overweight Max" value={settings.bmi.overweightMax} onChange={(value) => updateGroup("bmi", "overweightMax", value)} />
                            </InputGrid>
                        </ThresholdPanel>
                    </div>
                </SettingsSection>

                <SettingsSection
                    icon={Bell}
                    title="Alert Settings"
                    description="Control whether abnormal readings appear in alert monitoring."
                >
                    <div className="grid gap-4 lg:grid-cols-2">
                        <article className="rounded-[14px] border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
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

                        <article className="rounded-[14px] border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                            <label className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-muted)" }}>
                                Alert Sensitivity
                                <select
                                    value={settings.alertSensitivity}
                                    onChange={(event) => updateValue("alertSensitivity", event.target.value)}
                                    className="mt-3 h-12 w-full rounded-xl border px-4 text-sm font-black outline-none"
                                    style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                                >
                                    <option>Low</option>
                                    <option>Standard</option>
                                    <option>High</option>
                                </select>
                            </label>
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
                </SettingsSection>

                <SettingsSection
                    icon={SlidersHorizontal}
                    title="Kiosk Maintenance Lock"
                    description="Temporarily restrict user-side kiosk access while admin performs maintenance. Admin pages remain accessible."
                >
                    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                        <article className="rounded-[14px] border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                            <ThresholdInput
                                label="Maintenance Duration"
                                value={settings.kioskMaintenanceHours}
                                onChange={(value) => updateValue("kioskMaintenanceHours", value)}
                                helper="Hours the user-side kiosk will be unavailable. Example: 2 means users cannot use the kiosk for 2 hours."
                            />
                            <div className="mt-4 flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={startMaintenance}
                                    className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-black text-white transition hk-primary-hover"
                                    style={{ backgroundColor: "var(--color-primary)" }}
                                >
                                    <Clock size={17} />
                                    Start Maintenance
                                </button>
                                <button
                                    type="button"
                                    onClick={cancelMaintenance}
                                    disabled={!maintenanceActive}
                                    className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-45 hk-admin-nav-hover"
                                    style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                                >
                                    Cancel Maintenance
                                </button>
                            </div>
                        </article>

                        <article className="rounded-[14px] border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                            <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-muted)" }}>
                                Current user-side restriction
                            </p>
                            <p className="mt-3 text-3xl font-black" style={{ color: maintenanceActive ? "var(--color-primary)" : "var(--color-success)" }}>
                                {maintenanceActive ? formatCountdown(maintenanceUntil - now) : "Available"}
                            </p>
                            <p className="mt-3 text-sm font-semibold leading-6" style={{ color: "var(--color-muted)" }}>
                                {maintenanceActive
                                    ? "Users cannot access the kiosk until the countdown finishes. Admin can cancel this anytime."
                                    : "The user-side kiosk is currently available."}
                            </p>
                        </article>
                    </div>
                </SettingsSection>

                <section className="flex flex-col gap-4 rounded-[14px] border p-5 sm:flex-row sm:items-center sm:justify-between" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                    <div>
                        <p className="font-black">Settings apply after saving</p>
                        <p className="mt-1 text-sm font-semibold" style={{ color: "var(--color-muted)" }}>
                            Thresholds update health status, alerts, reports, and kiosk session timeout rules.
                            Alert sensitivity is applied instantly to the Health Alerts queue.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={restoreDefaults}
                            className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-black transition hk-admin-nav-hover"
                            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                        >
                            <RotateCcw size={17} />
                            Restore Defaults
                        </button>
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-black text-white transition hk-primary-hover"
                            style={{ backgroundColor: "var(--color-primary)" }}
                        >
                            <Save size={17} />
                            Save Settings
                        </button>
                    </div>
                </section>
            </AdminModulePage>
        </AdminShell>
    );
}

function SettingsSection({ icon: Icon, title, description, children }) {
    return (
        <section className="rounded-[14px] border p-5" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="flex items-start gap-3 border-b pb-5" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: "var(--color-surface)", color: "var(--color-primary)" }}>
                    <Icon size={22} />
                </div>
                <div>
                    <h3 className="text-xl font-black">{title}</h3>
                    <p className="mt-1 text-sm font-semibold leading-6" style={{ color: "var(--color-muted)" }}>{description}</p>
                </div>
            </div>
            <div className="mt-5">{children}</div>
        </section>
    );
}

function ThresholdPanel({ icon: Icon, title, description, accent, children }) {
    return (
        <article className="rounded-[14px] border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <div className="flex items-start gap-3">
                <Icon size={24} style={{ color: accentColor(accent) }} />
                <div>
                    <h4 className="text-lg font-black">{title}</h4>
                    <p className="mt-1 text-sm font-semibold leading-6" style={{ color: "var(--color-muted)" }}>{description}</p>
                </div>
            </div>
            <div className="mt-5">{children}</div>
        </article>
    );
}

function SegmentBar({ segments, labels = [] }) {
    const colors = {
        alert: "var(--color-error)",
        normal: "var(--color-success)",
        watch: "var(--color-primary)",
        under: "#22a8e8",
        over: "#f59e0b",
        high: "var(--color-error)",
    };

    return (
        <div className="mb-5 overflow-hidden rounded-full">
            <div className="flex h-3">
                {segments.map((segment, index) => (
                    <div key={`${segment}-${index}`} className="flex-1" style={{ backgroundColor: colors[segment] || "var(--color-primary)" }} title={labels[index] || segment} />
                ))}
            </div>
            {labels.length ? (
                <div className="mt-2 grid text-center text-[0.62rem] font-black text-white" style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}>
                    {labels.map((label) => (
                        <span key={label} style={{ color: "var(--color-muted)" }}>{label}</span>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

function InputGrid({ children }) {
    return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
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
            {helper ? <p className="mt-2 text-xs normal-case tracking-normal" style={{ color: "var(--color-muted)" }}>{helper}</p> : null}
        </label>
    );
}

function accentColor(accent) {
    if (accent === "temperature") return "var(--color-error)";
    if (accent === "heart") return "var(--color-primary)";
    if (accent === "spo2") return "var(--color-success)";
    if (accent === "bmi") return "#a78bfa";
    return "var(--color-primary)";
}

function formatCountdown(milliseconds) {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
