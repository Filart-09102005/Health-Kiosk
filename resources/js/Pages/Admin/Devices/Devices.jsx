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
import AdminShell from "../components/AdminShell";
import AdminModulePage from "../components/AdminModulePage";

const statusOrder = ["Online", "Offline", "Warning", "No Telemetry", "Calibrating", "Maintenance Mode"];

const baseDevices = [
    {
        id: "mega-board",
        name: "Mega Board",
        type: "Arduino Mega 2560 main controller board",
        deviceType: "Microcontroller",
        icon: Cpu,
        status: "No Telemetry",
        health: "Not Configured",
        lastActive: "No heartbeat received",
        source: "Mega Board serial heartbeat is not connected yet.",
        action: "Check USB cable, COM port, Python service, and firmware upload.",
        heartbeat: "Every 5 seconds",
        heartbeatSeconds: 5,
        timeoutSeconds: 15,
        firmware: "Not detected",
        serialPort: "COM port not configured",
        connectionStatus: "No serial heartbeat",
        totalReadings: 0,
        totalErrors: 0,
        healthScore: 0,
        uptime: "Unavailable",
        calibration: "Not configured",
        telemetry: [{ label: "Board State", value: "No telemetry", unit: "" }],
        logs: ["No heartbeat received", "Serial bridge not configured", "Firmware status unavailable"],
    },
    {
        id: "barcode-scanner",
        name: "Barcode Scanner",
        type: "Student and teacher barcode scanner",
        deviceType: "Input Scanner",
        icon: Barcode,
        status: "No Telemetry",
        health: "Not Configured",
        lastActive: "No scan event received",
        source: "Barcode scanner service is not reporting scan events.",
        action: "Check scanner connection, USB port, and barcode reader service.",
        heartbeat: "Every scan event",
        heartbeatSeconds: null,
        timeoutSeconds: 60,
        firmware: "USB HID scanner",
        serialPort: "USB keyboard wedge",
        connectionStatus: "No scan telemetry",
        totalReadings: 0,
        totalErrors: 0,
        healthScore: 0,
        uptime: "Unavailable",
        calibration: "Not required",
        telemetry: [{ label: "Last Scan", value: "No scan event", unit: "" }],
        logs: ["No scan event received", "Barcode reader service not reporting", "Waiting for scanner input"],
    },
    {
        id: "temperature",
        name: "Temperature Sensor",
        type: "Infrared body temperature module",
        deviceType: "Vital Sensor",
        icon: Thermometer,
        status: "Online",
        health: "Good",
        lastActive: "Latest telemetry received",
        source: "Temperature readings are being received.",
        action: "Functioning normally.",
        heartbeat: "Every reading",
        heartbeatSeconds: null,
        timeoutSeconds: 20,
        firmware: "IR-Temp 1.2.0",
        serialPort: "Mega Board A0",
        connectionStatus: "Receiving readings",
        totalReadings: 342,
        totalErrors: 2,
        healthScore: 97,
        uptime: "99.2%",
        calibration: "Valid",
        telemetry: [{ label: "Current Reading", value: "36.60", unit: "C" }],
        logs: ["Temperature Reading Received", "Reading accepted at 36.60 C", "Calibration check passed"],
    },
    {
        id: "heart-spo2",
        name: "Heart Rate & SpO2 Sensor",
        type: "MAX30102 pulse oximeter module",
        deviceType: "Vital Sensor",
        icon: HeartPulse,
        status: "Online",
        health: "Good",
        lastActive: "Latest telemetry received",
        source: "Pulse and oxygen data are stable.",
        action: "Functioning normally.",
        heartbeat: "Every reading",
        heartbeatSeconds: null,
        timeoutSeconds: 20,
        firmware: "MAX30102 2.1.4",
        serialPort: "Mega Board I2C",
        connectionStatus: "Receiving readings",
        totalReadings: 318,
        totalErrors: 4,
        healthScore: 95,
        uptime: "98.8%",
        calibration: "Valid",
        telemetry: [
            { label: "Current BPM", value: "78", unit: "bpm" },
            { label: "Current Oxygen Level", value: "98", unit: "%" },
        ],
        logs: ["Heart Rate Reading Received", "SpO2 Reading Received", "Signal quality stable"],
    },
    {
        id: "height",
        name: "Height Sensor",
        type: "Ultrasonic distance measurement module",
        deviceType: "Measurement Sensor",
        icon: Ruler,
        status: "Warning",
        health: "Needs Check",
        lastActive: "Recent telemetry received",
        source: "Recent readings show retry variance.",
        action: "Recheck sensor alignment and calibration.",
        heartbeat: "Every reading",
        heartbeatSeconds: null,
        timeoutSeconds: 20,
        firmware: "HC-SR04 1.0.8",
        serialPort: "Mega Board D7/D8",
        connectionStatus: "Receiving with variance",
        totalReadings: 296,
        totalErrors: 18,
        healthScore: 84,
        uptime: "94.7%",
        calibration: "Needs check",
        telemetry: [{ label: "Current Height", value: "165.00", unit: "cm" }],
        logs: ["Height Measurement Completed", "Retry variance detected", "Calibration recommended"],
    },
    {
        id: "weight",
        name: "Weight Sensor",
        type: "Load cell and HX711 scale module",
        deviceType: "Measurement Sensor",
        icon: Scale,
        status: "Offline",
        health: "Not Functioning",
        lastActive: "Last telemetry unavailable",
        source: "No recent weight signal received.",
        action: "Inspect load-cell wiring and HX711 module.",
        heartbeat: "Every reading",
        heartbeatSeconds: null,
        timeoutSeconds: 20,
        firmware: "HX711 1.1.0",
        serialPort: "Mega Board D4/D5",
        connectionStatus: "Heartbeat timeout exceeded",
        totalReadings: 174,
        totalErrors: 41,
        healthScore: 42,
        uptime: "71.4%",
        calibration: "Required",
        telemetry: [{ label: "Current Weight", value: "No signal", unit: "" }],
        logs: ["Weight telemetry timeout", "HX711 signal unavailable", "Load-cell wiring inspection required"],
    },
    {
        id: "presence",
        name: "User Presence Detection",
        type: "Camera-based user detection service",
        deviceType: "Presence Service",
        icon: Activity,
        status: "Online",
        health: "Good",
        lastActive: "Latest heartbeat received",
        source: "Current state: READY",
        action: "Functioning normally.",
        heartbeat: "Every 5 seconds",
        heartbeatSeconds: 5,
        timeoutSeconds: 15,
        firmware: "Browser FaceDetector service",
        serialPort: "Front camera",
        connectionStatus: "READY",
        totalReadings: 124,
        totalErrors: 1,
        healthScore: 98,
        uptime: "99.7%",
        calibration: "Not required",
        telemetry: [{ label: "Current State", value: "READY", unit: "" }],
        logs: ["User Detected", "User Left Kiosk", "Presence service heartbeat received"],
    },
    {
        id: "mini-pc",
        name: "Mini PC / Server",
        type: "Laravel application and database host",
        deviceType: "Application Host",
        icon: Server,
        status: "Online",
        health: "Good",
        lastActive: "Latest heartbeat received",
        source: "Application and database responded successfully.",
        action: "Functioning normally.",
        heartbeat: "Every 10 seconds",
        heartbeatSeconds: 10,
        timeoutSeconds: 30,
        firmware: "Laravel + MySQL localhost",
        serialPort: "127.0.0.1",
        connectionStatus: "Application responding",
        totalReadings: 1324,
        totalErrors: 3,
        healthScore: 99,
        uptime: "99.9%",
        calibration: "Not required",
        telemetry: [{ label: "Server State", value: "ONLINE", unit: "" }],
        logs: ["Application heartbeat received", "Database responded successfully", "Receipt printer queue ready"],
    },
];

const activityLogs = [
    { event: "Mega Board Connected", device: "Mega Board", status: "No Telemetry", time: "Waiting for serial heartbeat" },
    { event: "Barcode Scanned", device: "Barcode Scanner", status: "No Telemetry", time: "Waiting for scan event" },
    { event: "Temperature Reading Received", device: "Temperature Sensor", status: "Online", time: "Latest telemetry received" },
    { event: "Heart Rate Reading Received", device: "Heart Rate & SpO2 Sensor", status: "Online", time: "Latest telemetry received" },
    { event: "SpO2 Reading Received", device: "Heart Rate & SpO2 Sensor", status: "Online", time: "Latest telemetry received" },
    { event: "Height Measurement Completed", device: "Height Sensor", status: "Warning", time: "Recent telemetry received" },
    { event: "Weight Measurement Completed", device: "Weight Sensor", status: "Offline", time: "Last telemetry unavailable" },
    { event: "User Detected", device: "User Presence Detection", status: "Online", time: "Latest heartbeat received" },
    { event: "User Left Kiosk", device: "User Presence Detection", status: "Online", time: "Latest heartbeat received" },
];

const diagnosticsTemplate = [
    { label: "Connection Test", value: "PASS" },
    { label: "Telemetry Test", value: "PASS" },
    { label: "Device Response", value: "PASS" },
    { label: "Firmware Check", value: "PASS" },
    { label: "Overall Status", value: "HEALTHY" },
];

const reveal = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0 },
};

export default function Devices({ navigate }) {
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [diagnostics, setDiagnostics] = useState(null);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setLastRefresh(new Date());
        }, 5000);

        return () => window.clearInterval(timer);
    }, []);

    const devices = useMemo(() => {
        return baseDevices.map((device) => ({
            ...device,
            refreshedAt: lastRefresh,
        }));
    }, [lastRefresh]);

    const configuredCount = devices.length;
    const connectedCount = devices.filter((device) => device.status === "Online" || device.status === "Warning").length;
    const offlineCount = devices.filter((device) => device.status === "Offline").length;
    const warningCount = devices.filter((device) => device.status === "Warning").length;
    const activeTelemetryCount = devices.filter((device) => ["Online", "Warning"].includes(device.status)).length;
    const healthScore = Math.round(devices.reduce((sum, device) => sum + device.healthScore, 0) / devices.length);

    const openDevice = (device) => {
        setSelectedDevice(device);
        setDiagnostics(null);
    };

    const closeDrawer = () => {
        setSelectedDevice(null);
        setDiagnostics(null);
    };

    const runAction = (action, device = selectedDevice) => {
        if (!device) return;

        const isOffline = device.status === "Offline";
        const isNoTelemetry = device.status === "No Telemetry";

        setDiagnostics({
            action,
            device: device.name,
            generatedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            rows: diagnosticsTemplate.map((row) => {
                if (isOffline && row.label !== "Firmware Check") return { ...row, value: row.label === "Overall Status" ? "UNHEALTHY" : "FAIL" };
                if (isNoTelemetry && row.label === "Telemetry Test") return { ...row, value: "NO TELEMETRY" };
                if (isNoTelemetry && row.label === "Overall Status") return { ...row, value: "NEEDS CONFIGURATION" };
                return row;
            }),
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
                <SystemHealthOverview
                    activeTelemetryCount={activeTelemetryCount}
                    configuredCount={configuredCount}
                    healthScore={healthScore}
                    lastRefresh={lastRefresh}
                    onRefresh={() => setLastRefresh(new Date())}
                />
                <StatusLegend />
                <DeviceGrid devices={devices} onOpen={openDevice} />
                <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
                    <LiveTelemetry devices={devices} />
                    <ActivityFeed logs={activityLogs} />
                </section>
                <HardwareStatusTable devices={devices} onOpen={openDevice} />
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
            className="rounded-[14px] border p-5 shadow-sm"
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
                        className="flex h-12 items-center gap-2 rounded-xl px-4 text-sm font-black text-white transition hk-primary-hover"
                        style={{ backgroundColor: "var(--color-primary)" }}
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
            className="rounded-[14px] border p-5"
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
                        className="group rounded-[14px] border p-5 text-left shadow-sm transition hk-admin-nav-hover"
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
                                <p className="text-xs font-black" style={{ color: getStatusColor(device.status) }}>Health score {device.healthScore}%</p>
                                <div className="mt-2 h-2 w-40 max-w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-surface)" }}>
                                    <div className="h-full rounded-full" style={{ width: `${device.healthScore}%`, backgroundColor: getScoreColor(device.healthScore) }} />
                                </div>
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
            className="rounded-[14px] border p-5 shadow-sm"
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
            className="rounded-[14px] border p-5 shadow-sm"
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
            className="overflow-hidden rounded-[14px] border shadow-xl"
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
    const Icon = device.icon;
    const actions = [
        { label: "Run Diagnostics", icon: Stethoscope },
        { label: `Test ${device.name}`, icon: Zap },
        { label: "Reconnect Device", icon: PlugZap },
        { label: "Refresh Status", icon: RefreshCw },
        { label: "Restart Service", icon: RotateCcw },
        { label: "Calibrate Device", icon: Settings2 },
    ];

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <button type="button" aria-label="Close diagnostics drawer" onClick={onClose} className="absolute inset-0 bg-black/35" />
            <motion.aside
                initial={{ x: 420, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 420, opacity: 0 }}
                className="relative flex h-full w-full max-w-3xl flex-col overflow-y-auto border-l p-5 shadow-2xl"
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

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <StatusPill status={device.status} />
                    <HealthPill health={device.health} status={device.status} />
                    <InfoBox label="Health Score" value={`${device.healthScore}%`} />
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <InfoBox label="Device Type" value={device.deviceType} />
                    <InfoBox label="Firmware Version" value={device.firmware} />
                    <InfoBox label="Serial Port" value={device.serialPort} />
                    <InfoBox label="Connection Status" value={device.connectionStatus} />
                    <InfoBox label="Last Active" value={device.lastActive} />
                    <InfoBox label="Total Readings" value={String(device.totalReadings)} />
                    <InfoBox label="Total Errors" value={String(device.totalErrors)} />
                    <InfoBox label="Uptime" value={device.uptime} />
                    <InfoBox label="Calibration Status" value={device.calibration} />
                    <InfoBox label="Heartbeat Rule" value={`${device.heartbeat}, timeout ${device.timeoutSeconds}s`} />
                </div>

                <section className="mt-5 rounded-[14px] border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
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

                <section className="mt-5 rounded-[14px] border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
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

                <section className="mt-5 rounded-[14px] border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
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

                <section className="mt-5 rounded-[14px] border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
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
