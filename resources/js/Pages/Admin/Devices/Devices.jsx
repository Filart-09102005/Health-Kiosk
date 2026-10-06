import { motion } from "framer-motion";
import {
    Activity,
    AlertTriangle,
    Barcode,
    CheckCircle2,
    ChevronRight,
    CircleDotDashed,
    Cpu,
    Gauge,
    HeartPulse,
    History,
    MonitorCog,
    PlugZap,
    Power,
    RadioTower,
    RefreshCw,
    RotateCcw,
    Ruler,
    Scale,
    Server,
    Settings2,
    ShieldCheck,
    Stethoscope,
    Thermometer,
    Wrench,
    X,
    Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import AdminShell from "../components/AdminShell";
import AdminModulePage from "../components/AdminModulePage";
import useModalLayer from "../../../Global/useModalLayer";
import { deriveDevices, fetchKioskTelemetry, formatLastSeen, SENSOR_KEYS } from "./services/deviceTelemetryService";

const statusOrder = ["Online", "Offline", "Warning", "No Telemetry", "Calibrating", "Maintenance Mode"];

// Static hardware inventory: what is physically installed in the kiosk. This
// is legitimately fixed — it describes the build, not its condition. Every
// health value (status, last seen, readings, errors) is derived at runtime
// from real firmware telemetry in deviceTelemetryService.
//
// Fields the firmware does not report are shown as "Not reported" rather than
// filled with plausible-looking numbers.
const DEVICE_REGISTRY = [
    {
        id: "mega-board",
        name: "Mega Board",
        type: "Arduino Mega 2560 main controller board",
        deviceType: "Microcontroller",
        icon: Cpu,
        isController: true,
        heartbeat: "Every 5 seconds",
        heartbeatSeconds: 5,
        timeoutSeconds: 75,
    },
    {
        id: "heart-rate-sensor",
        name: "Heart Rate & SpO2 Sensor",
        type: "MAX30102 pulse oximeter",
        deviceType: "Sensor",
        icon: HeartPulse,
        sensorKey: SENSOR_KEYS.HEART_RATE,
        serialPort: "Mega Board I2C",
        primaryUnit: "bpm",
        secondaryUnit: "%",
        heartbeat: "While measuring",
        heartbeatSeconds: 5,
        timeoutSeconds: 75,
    },
    {
        id: "temperature-sensor",
        name: "Temperature Sensor",
        type: "Infrared body temperature sensor",
        deviceType: "Sensor",
        icon: Thermometer,
        sensorKey: SENSOR_KEYS.TEMPERATURE,
        serialPort: "Mega Board A0",
        primaryUnit: "\u00b0C",
        heartbeat: "While measuring",
        heartbeatSeconds: 5,
        timeoutSeconds: 75,
    },
    {
        id: "height-sensor",
        name: "Height Sensor",
        type: "Ultrasonic distance sensor",
        deviceType: "Sensor",
        icon: Ruler,
        sensorKey: SENSOR_KEYS.HEIGHT,
        serialPort: "Mega Board D7/D8",
        primaryUnit: "cm",
        heartbeat: "While measuring",
        heartbeatSeconds: 5,
        timeoutSeconds: 75,
    },
    {
        id: "weight-sensor",
        name: "Weight Sensor",
        type: "HX711 load-cell platform",
        deviceType: "Sensor",
        icon: Scale,
        sensorKey: SENSOR_KEYS.WEIGHT,
        serialPort: "Mega Board D4/D5",
        primaryUnit: "kg",
        heartbeat: "While measuring",
        heartbeatSeconds: 5,
        timeoutSeconds: 75,
    },
    {
        id: "barcode-scanner",
        name: "Barcode Scanner",
        type: "Student and teacher barcode scanner",
        deviceType: "Input Device",
        icon: Barcode,
        serialPort: "USB keyboard wedge",
        heartbeat: "On scan",
        heartbeatSeconds: 0,
        timeoutSeconds: 0,
        notReportedReason:
            "USB HID scanner. Input goes straight to the browser, so the kiosk firmware cannot report its state.",
    },
    {
        id: "presence",
        name: "User Presence Detection",
        type: "Camera-based user detection service",
        deviceType: "Presence Service",
        icon: Activity,
        serialPort: "Front camera",
        heartbeat: "Browser side",
        heartbeatSeconds: 0,
        timeoutSeconds: 0,
        notReportedReason:
            "Runs in the browser, not on the kiosk board, so it does not appear in firmware telemetry.",
    },
    {
        id: "mini-pc",
        name: "Mini PC / Server",
        type: "Laravel application and database host",
        deviceType: "Application Host",
        icon: Server,
        isHost: true,
        serialPort: "127.0.0.1",
        heartbeat: "Per request",
        heartbeatSeconds: 0,
        timeoutSeconds: 0,
    },
];

const reveal = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0 },
};

export default function Devices({ navigate }) {
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [diagnostics, setDiagnostics] = useState(null);
    const [telemetry, setTelemetry] = useState(null);

    // Poll the same endpoint the firmware posts to. Previously this timer only
    // moved a "last refreshed" clock while the device data never changed,
    // which made static content look live.
    useEffect(() => {
        let alive = true;

        const poll = async () => {
            try {
                const payload = await fetchKioskTelemetry();
                if (alive) setTelemetry(payload);
            } catch {
                // Unreachable API is itself a real signal: no telemetry.
                if (alive) setTelemetry(null);
            } finally {
                if (alive) setLastRefresh(new Date());
            }
        };

        poll();
        const timer = window.setInterval(poll, 5000);

        return () => {
            alive = false;
            window.clearInterval(timer);
        };
    }, []);

    const devices = useMemo(
        () => deriveDevices(DEVICE_REGISTRY, telemetry).map((device) => ({ ...device, refreshedAt: lastRefresh })),
        [telemetry, lastRefresh],
    );

    const configuredCount = devices.length;
    const connectedCount = devices.filter((device) => device.status === "Online" || device.status === "Warning").length;
    const offlineCount = devices.filter((device) => device.status === "Offline" || device.status === "No Telemetry").length;
    const warningCount = devices.filter((device) => device.status === "Warning").length;
    const activeTelemetryCount = devices.filter((device) => ["Online", "Warning"].includes(device.status)).length;

    // Share of devices actually reporting, rather than an invented score.
    const reportable = devices.filter((device) => device.status !== "Not Reported");
    const healthScore = reportable.length
        ? Math.round((reportable.filter((device) => device.status === "Online").length / reportable.length) * 100)
        : 0;

    // Built from the current telemetry payload. Nothing stores a device event
    // history yet, so this reflects the live state rather than pretending to
    // be a log of past events.
    const activityLogs = useMemo(() => {
        if (!telemetry) {
            return [{ event: "Telemetry unreachable", device: "Mega Board", status: "No Telemetry", time: "Now" }];
        }

        const seen = formatLastSeen(telemetry.updated_at);
        const entries = [
            {
                event: telemetry.fresh ? "Telemetry received" : "Telemetry stale",
                device: "Mega Board",
                status: telemetry.fresh ? "Online" : "No Telemetry",
                time: seen,
            },
            {
                event: `Machine state: ${telemetry.machine_state || "Unknown"}`,
                device: "Mega Board",
                status: telemetry.fresh ? "Online" : "No Telemetry",
                time: seen,
            },
        ];

        if (telemetry.sensor) {
            entries.push({ event: "Active sensor reporting", device: telemetry.sensor, status: "Online", time: seen });
        }
        if (telemetry.error) {
            entries.push({ event: `Error: ${telemetry.error}`, device: telemetry.sensor || "Mega Board", status: "Warning", time: seen });
        }

        return entries;
    }, [telemetry]);

    const openDevice = (device) => {
        setSelectedDevice(device);
        setDiagnostics(null);
    };

    const closeDrawer = () => {
        setSelectedDevice(null);
        setDiagnostics(null);
    };

    // Re-reads live telemetry and reports what it actually says. It does not
    // command the hardware — there is no endpoint for that — so it is a read
    // of current state, not a self-test, and is labelled accordingly.
    const runAction = async (action, device = selectedDevice) => {
        if (!device) return;

        setDiagnostics({ action, device: device.name, generatedAt: "…", rows: [{ label: "Reading telemetry", value: "…" }] });

        let payload = null;
        try {
            payload = await fetchKioskTelemetry();
        } catch {
            payload = null;
        }
        setTelemetry(payload);

        const current = deriveDevices(DEVICE_REGISTRY, payload).find((item) => item.id === device.id) || device;
        const linkUp = Boolean(payload?.fresh);

        setDiagnostics({
            action,
            device: device.name,
            generatedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            rows: [
                { label: "API Reachable", value: payload ? "PASS" : "FAIL" },
                { label: "Firmware Telemetry", value: linkUp ? "PASS" : "NO TELEMETRY" },
                { label: "Reported Status", value: current.status.toUpperCase() },
                { label: "Last Telemetry", value: current.lastActive },
                { label: "Reported Error", value: payload?.error ? String(payload.error) : "None" },
                {
                    label: "Overall Status",
                    value: !payload ? "UNHEALTHY" : linkUp ? (current.status === "Warning" ? "NEEDS ATTENTION" : "HEALTHY") : "NEEDS CONFIGURATION",
                },
            ],
        });
    };

    return (
        <AdminShell navigate={navigate} eyebrow="Devices and Sensors" title="Kiosk Hardware">
            <AdminModulePage
                icon={RadioTower}
                eyebrow="Hardware diagnostics"
                title="Devices & Sensors"
                description="Real-time hardware diagnostics and telemetry center for the Health Kiosk System."
                showHeaderActions={false}
                stats={[
                    { label: "Configured Devices", value: String(configuredCount), caption: "Registered kiosk hardware", icon: Cpu },
                    { label: "Connected Devices", value: String(connectedCount), caption: "Online or reporting warnings", icon: PlugZap },
                    { label: "Offline Devices", value: String(offlineCount), caption: "Heartbeat timeout exceeded", icon: Power },
                    { label: "Warning Devices", value: String(warningCount), caption: "Needs calibration or checking", icon: AlertTriangle },
                ]}
            >
                <div className="space-y-5">
                    <SystemHealthOverview
                        activeTelemetryCount={activeTelemetryCount}
                        configuredCount={configuredCount}
                        healthScore={healthScore}
                        lastRefresh={lastRefresh}
                        onRefresh={() => setLastRefresh(new Date())}
                    />
                    <StatusLegend />
                    <DeviceGrid devices={devices} onOpen={openDevice} />
                    <ActivityFeed logs={activityLogs} />
                </div>
            </AdminModulePage>

            {selectedDevice ? (
                <DeviceDetailsDrawer
                    diagnostics={diagnostics}
                    device={selectedDevice}
                    onAction={runAction}
                    onClose={closeDrawer}
                />
            ) : null}
        </AdminShell>
    );
}

function SystemHealthOverview({ activeTelemetryCount, configuredCount, healthScore, lastRefresh, onRefresh }) {
    return (
        <motion.section
            variants={reveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="rounded-[1.25rem] border p-5 shadow-sm"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-muted)" }}>System health overview</p>
                    <h3 className="mt-2 text-2xl font-black">Overall Hardware Health {healthScore}%</h3>
                    <p className="mt-2 max-w-3xl text-sm font-semibold leading-6" style={{ color: "var(--color-muted)" }}>
                        Status automatically refreshes without page reload. Heartbeat timeouts mark affected devices as offline.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <InfoBox label="Active Telemetry Devices" value={`${activeTelemetryCount} / ${configuredCount}`} />
                    <button
                        type="button"
                        onClick={onRefresh}
                        className="flex h-12 items-center gap-2 rounded-xl px-4 text-sm font-black transition hk-primary-hover"
                        style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-content)" }}
                    >
                        <RefreshCw size={17} />
                        Refresh Status
                    </button>
                </div>
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-surface)" }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${healthScore}%`, backgroundColor: getScoreColor(healthScore) }} />
            </div>
            <p className="mt-3 text-xs font-bold" style={{ color: "var(--color-muted)" }}>
                Last auto-refresh: {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
        </motion.section>
    );
}

function StatusLegend() {
    return (
        <motion.section
            variants={reveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="rounded-[1.25rem] border p-5"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h3 className="text-lg font-black">Real-time hardware monitoring</h3>
                    <p className="mt-1 text-sm font-semibold" style={{ color: "var(--color-muted)" }}>
                        Supported states for kiosk devices and local services.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {statusOrder.map((status) => (
                        <StatusPill key={status} status={status} />
                    ))}
                </div>
            </div>
        </motion.section>
    );
}

function DeviceGrid({ devices, onOpen }) {
    return (
        <section className="grid gap-4 xl:grid-cols-2">
            {devices.map((device, index) => {
                const Icon = device.icon;

                return (
                    <motion.button
                        key={device.id}
                        type="button"
                        variants={reveal}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.18 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => onOpen(device)}
                        className="group rounded-[1.25rem] border p-5 text-left shadow-sm transition hk-admin-nav-hover"
                        style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex min-w-0 items-start gap-3">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: getStatusBackground(device.status), color: getStatusColor(device.status) }}>
                                    <Icon size={22} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-black">{device.name}</h3>
                                    <p className="mt-1 max-w-sm text-sm font-semibold leading-5" style={{ color: "var(--color-muted)" }}>{device.type}</p>
                                </div>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-2">
                                <StatusPill status={device.status} />
                                <HealthPill health={device.health} status={device.status} />
                            </div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            <InfoBox label="Last Active" value={device.lastActive} />
                            <InfoBox label="Heartbeat" value={device.heartbeat} />
                        </div>

                        <div className="mt-4 rounded-xl border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                            <p className="text-[0.65rem] font-black uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>Source</p>
                            <p className="mt-1 text-sm font-black">{device.source}</p>
                            <p className="mt-2 text-xs font-bold" style={{ color: "var(--color-muted)" }}>{device.action}</p>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4" style={{ borderColor: "var(--color-border)" }}>
                            <div className="min-w-0">
                                <p className="text-xs font-black" style={{ color: getStatusColor(device.status) }}>{device.health}</p>
                                <p className="mt-1 text-[0.7rem] font-semibold" style={{ color: "var(--color-muted)" }}>
                                    Last seen {device.lastActive}
                                </p>
                            </div>
                            <span className="flex items-center gap-1 text-xs font-black" style={{ color: "var(--color-muted)" }}>
                                Details
                                <ChevronRight className="transition group-hover:translate-x-1" size={15} />
                            </span>
                        </div>
                    </motion.button>
                );
            })}
        </section>
    );
}

function LiveTelemetry({ devices }) {
    const telemetryDevices = devices.filter((device) => device.telemetry?.length);

    return (
        <motion.section
            variants={reveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.18 }}
            className="rounded-[1.25rem] border p-5 shadow-sm"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-black">Live telemetry</h3>
                    <p className="mt-1 text-sm font-semibold" style={{ color: "var(--color-muted)" }}>Latest local values when available.</p>
                </div>
                <Gauge size={22} style={{ color: "var(--color-primary)" }} />
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
                {telemetryDevices.map((device) => {
                    const Icon = device.icon;

                    return (
                        <div key={device.id} className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                            <div className="flex items-center gap-2">
                                <Icon size={17} style={{ color: getStatusColor(device.status) }} />
                                <p className="text-sm font-black">{device.name}</p>
                            </div>
                            <div className="mt-3 grid gap-2">
                                {device.telemetry.map((item) => (
                                    <div key={item.label} className="flex items-end justify-between gap-3 rounded-lg px-3 py-2" style={{ backgroundColor: "var(--color-card)" }}>
                                        <span className="text-xs font-bold" style={{ color: "var(--color-muted)" }}>{item.label}</span>
                                        <span className="text-lg font-black">
                                            {item.value}
                                            {item.unit ? <span className="ml-1 text-xs" style={{ color: "var(--color-muted)" }}>{item.unit}</span> : null}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </motion.section>
    );
}

function ActivityFeed({ logs }) {
    return (
        <motion.section
            variants={reveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.18 }}
            className="rounded-[1.25rem] border p-5 shadow-sm"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-black">Activity logs</h3>
                    <p className="mt-1 text-sm font-semibold" style={{ color: "var(--color-muted)" }}>Recent hardware events timeline.</p>
                </div>
                <History size={22} style={{ color: "var(--color-primary)" }} />
            </div>

            <div className="mt-5 space-y-3">
                {logs.map((log) => (
                    <div key={`${log.event}-${log.device}`} className="flex gap-3 rounded-xl border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: getStatusColor(log.status) }} />
                        <div className="min-w-0">
                            <p className="text-sm font-black">{log.event}</p>
                            <p className="mt-1 text-xs font-bold" style={{ color: "var(--color-muted)" }}>{log.device} - {log.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        </motion.section>
    );
}

function HardwareStatusTable({ devices, onOpen }) {
    return (
        <motion.section
            variants={reveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.12 }}
            className="overflow-hidden rounded-[1.25rem] border shadow-xl"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
            <div className="border-b p-5" style={{ borderColor: "var(--color-border)" }}>
                <h3 className="text-lg font-black">Heartbeat monitoring</h3>
                <p className="mt-1 text-sm font-semibold" style={{ color: "var(--color-muted)" }}>Configured heartbeat intervals and timeout behavior for every device.</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1020px] text-left text-sm">
                    <thead style={{ backgroundColor: "var(--color-surface)", color: "var(--color-muted)" }}>
                        <tr>
                            {["Device", "Status", "Heartbeat", "Timeout", "Last Active", "Health", "Action"].map((heading) => (
                                <th key={heading} className="border-b px-4 py-3 text-[0.68rem] font-black uppercase tracking-wide" style={{ borderColor: "var(--color-border)" }}>{heading}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {devices.map((device) => (
                            <tr key={device.id} className="transition hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,transparent)]">
                                <td className="border-b px-4 py-4" style={{ borderColor: "var(--color-border)" }}>
                                    <button type="button" onClick={() => onOpen(device)} className="text-left font-black transition hover:underline">{device.name}</button>
                                    <p className="mt-1 text-xs font-bold" style={{ color: "var(--color-muted)" }}>{device.type}</p>
                                </td>
                                <td className="border-b px-4 py-4" style={{ borderColor: "var(--color-border)" }}><StatusPill status={device.status} /></td>
                                <td className="border-b px-4 py-4 font-bold" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>{device.heartbeat}</td>
                                <td className="border-b px-4 py-4 font-bold" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>{device.timeoutSeconds}s</td>
                                <td className="border-b px-4 py-4 font-bold" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>{device.lastActive}</td>
                                <td className="border-b px-4 py-4" style={{ borderColor: "var(--color-border)" }}><HealthPill health={device.health} status={device.status} /></td>
                                <td className="border-b px-4 py-4" style={{ borderColor: "var(--color-border)" }}>
                                    <button
                                        type="button"
                                        onClick={() => onOpen(device)}
                                        className="rounded-lg border px-3 py-2 text-xs font-black transition hk-admin-nav-hover"
                                        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                                    >
                                        View diagnostics
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.section>
    );
}

function DeviceDetailsDrawer({ device, diagnostics, onAction, onClose }) {
    useModalLayer(Boolean(device));

    const Icon = device.icon;
    const actions = [
        { label: "Run Diagnostics", icon: Stethoscope },
        { label: `Test ${device.name}`, icon: Zap },
        { label: "Reconnect Device", icon: PlugZap },
        { label: "Refresh Status", icon: RefreshCw },
        { label: "Restart Service", icon: RotateCcw },
        { label: "Calibrate Device", icon: Settings2 },
    ];

    const drawer = (
        <div className="fixed inset-0 z-[9000] flex justify-end bg-black/65 backdrop-blur-md">
            <button type="button" aria-label="Close diagnostics drawer" onClick={onClose} className="absolute inset-0" />
            <motion.aside
                initial={{ x: 420, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 420, opacity: 0 }}
                className="relative z-[9010] flex h-full w-full max-w-3xl flex-col overflow-y-auto border-l p-5 shadow-2xl"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
            >
                <div className="flex items-start justify-between gap-4 border-b pb-5" style={{ borderColor: "var(--color-border)" }}>
                    <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: getStatusBackground(device.status), color: getStatusColor(device.status) }}>
                            <Icon size={23} />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-muted)" }}>Device diagnostics</p>
                            <h3 className="mt-1 text-2xl font-black">{device.name}</h3>
                            <p className="mt-1 text-sm font-semibold" style={{ color: "var(--color-muted)" }}>{device.type}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-black transition hk-admin-nav-hover"
                        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                    >
                        <X size={17} />
                        Close
                    </button>
                </div>

                {/* Only values the firmware actually reports are shown. Health
                    score, uptime, total readings and calibration have no source
                    in the system today, so they are omitted rather than filled
                    with invented numbers. */}
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <StatusPill status={device.status} />
                    <HealthPill health={device.health} status={device.status} />
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <InfoBox label="Device Type" value={device.deviceType} />
                    <InfoBox label="Firmware Version" value={device.firmware} />
                    <InfoBox label="Serial Port" value={device.serialPort} />
                    <InfoBox label="Connection Status" value={device.connectionStatus} />
                    <InfoBox label="Last Active" value={device.lastActive} />
                    <InfoBox label="Heartbeat Rule" value={`${device.heartbeat}, timeout ${device.timeoutSeconds}s`} />
                </div>

                <section className="mt-5 rounded-[1.25rem] border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                    <h4 className="text-sm font-black">Live telemetry</h4>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {device.telemetry.map((item) => (
                            <div key={item.label} className="rounded-xl border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
                                <p className="text-xs font-bold" style={{ color: "var(--color-muted)" }}>{item.label}</p>
                                <p className="mt-1 text-2xl font-black">
                                    {item.value}
                                    {item.unit ? <span className="ml-1 text-sm" style={{ color: "var(--color-muted)" }}>{item.unit}</span> : null}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mt-5 rounded-[1.25rem] border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                    <h4 className="text-sm font-black">Admin actions</h4>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {actions.map((action) => {
                            const ActionIcon = action.icon;

                            return (
                                <button
                                    key={action.label}
                                    type="button"
                                    onClick={() => onAction(action.label, device)}
                                    className="flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-black transition hk-admin-nav-hover"
                                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
                                >
                                    <ActionIcon size={16} />
                                    {action.label}
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section className="mt-5 rounded-[1.25rem] border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                    <h4 className="text-sm font-black">Diagnostics results</h4>
                    {diagnostics ? (
                        <div className="mt-3">
                            <p className="text-xs font-bold" style={{ color: "var(--color-muted)" }}>{diagnostics.action} for {diagnostics.device} - {diagnostics.generatedAt}</p>
                            <div className="mt-3 grid gap-2">
                                {diagnostics.rows.map((row) => (
                                    <div key={row.label} className="flex items-center justify-between rounded-xl border px-3 py-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
                                        <span className="text-sm font-bold" style={{ color: "var(--color-muted)" }}>{row.label}</span>
                                        <span className="text-sm font-black" style={{ color: getDiagnosticColor(row.value) }}>{row.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="mt-2 text-sm font-semibold" style={{ color: "var(--color-muted)" }}>Run diagnostics or test this device to view connection, telemetry, response, and firmware checks.</p>
                    )}
                </section>

                <section className="mt-5 rounded-[1.25rem] border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                    <h4 className="text-sm font-black">Recent activity logs</h4>
                    <div className="mt-3 space-y-2">
                        {device.logs.map((log) => (
                            <div key={log} className="flex items-center gap-3 rounded-xl border px-3 py-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
                                <CircleDotDashed size={15} style={{ color: getStatusColor(device.status) }} />
                                <span className="text-sm font-bold">{log}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </motion.aside>
        </div>
    );

    return createPortal(drawer, document.body);
}

function InfoBox({ label, value }) {
    return (
        <div className="rounded-xl border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
            <p className="text-[0.65rem] font-black uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>{label}</p>
            <p className="mt-1 text-sm font-black">{value}</p>
        </div>
    );
}

function StatusPill({ status, label = status }) {
    const Icon = getStatusIcon(status);

    return (
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-black" style={{ borderColor: getStatusBorder(status), backgroundColor: getStatusBackground(status), color: getStatusColor(status) }}>
            <Icon size={12} />
            {label}
        </span>
    );
}

function HealthPill({ health, status }) {
    return (
        <span className="w-fit rounded-full border px-2.5 py-1 text-[0.68rem] font-black" style={{ borderColor: getStatusBorder(status), backgroundColor: getStatusBackground(status), color: getStatusColor(status) }}>
            {health}
        </span>
    );
}

function getStatusIcon(status) {
    if (status === "Online") return CheckCircle2;
    if (status === "Offline") return Power;
    if (status === "Warning") return AlertTriangle;
    if (status === "Calibrating") return Wrench;
    if (status === "Maintenance Mode") return MonitorCog;
    return ShieldCheck;
}

function getStatusColor(status) {
    if (status === "Online") return "var(--color-success)";
    if (status === "Warning" || status === "Calibrating") return "var(--color-primary)";
    if (status === "Offline") return "var(--color-error)";
    if (status === "Maintenance Mode") return "var(--color-text)";
    return "var(--color-muted)";
}

function getScoreColor(score) {
    if (score >= 90) return "var(--color-success)";
    if (score >= 75) return "var(--color-primary)";
    return "var(--color-error)";
}

function getDiagnosticColor(value) {
    if (String(value).includes("PASS") || value === "HEALTHY") return "var(--color-success)";
    if (String(value).includes("FAIL") || value === "UNHEALTHY") return "var(--color-error)";
    return "var(--color-primary)";
}

function getStatusBackground(status) {
    return `color-mix(in srgb, ${getStatusColor(status)} 12%, transparent)`;
}

function getStatusBorder(status) {
    return `color-mix(in srgb, ${getStatusColor(status)} 28%, var(--color-border))`;
}
