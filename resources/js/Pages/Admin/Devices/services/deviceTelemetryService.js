const LIVE_VITALS_URL = "/api/kiosk/live-vitals";

/**
 * Reads the kiosk's live telemetry — the same payload the firmware POSTs to
 * /api/kiosk/live-vitals and the measurement flow polls.
 *
 * This is the only hardware truth the system currently has. There is no device
 * registry table, no per-sensor heartbeat and no firmware version reporting, so
 * anything not present in this payload is genuinely unknown and must be shown
 * as such rather than invented.
 */
export async function fetchKioskTelemetry() {
    const response = await fetch(`${LIVE_VITALS_URL}?_=${Date.now()}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
    });

    if (!response.ok) throw new Error(`Live vitals request failed (${response.status})`);

    return response.json();
}

export const UNKNOWN = "Not reported";

/** Firmware `sensor` values, as posted by the Mega board. */
export const SENSOR_KEYS = {
    HEART_RATE: "HEART_RATE",
    TEMPERATURE: "TEMPERATURE",
    HEIGHT: "HEIGHT",
    WEIGHT: "WEIGHT",
};

function secondsSince(isoString) {
    if (!isoString) return null;
    const then = new Date(isoString).getTime();
    if (Number.isNaN(then)) return null;
    return Math.max(0, Math.round((Date.now() - then) / 1000));
}

export function formatLastSeen(isoString) {
    const seconds = secondsSince(isoString);
    if (seconds === null) return "Never";
    if (seconds < 5) return "Just now";
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return new Date(isoString).toLocaleString();
}

/**
 * Turn one telemetry payload into per-device state.
 *
 * @param registry  Static hardware inventory — what is physically installed.
 *                  Legitimately fixed; it describes the build, not its health.
 * @param telemetry Response from fetchKioskTelemetry(), or null if unreachable.
 */
export function deriveDevices(registry, telemetry) {
    const linkUp = Boolean(telemetry?.fresh);
    const activeSensor = telemetry?.sensor || null;
    const machineState = telemetry?.machine_state || null;
    const error = telemetry?.error || null;
    const lastSeen = formatLastSeen(telemetry?.updated_at);

    return registry.map((device) => {
        // The application host. If this request came back at all, the server
        // and its database answered — that is real evidence, not a guess.
        if (device.isHost) {
            const responding = telemetry !== null;
            return {
                ...device,
                status: responding ? "Online" : "Offline",
                health: responding ? "Responding" : "Not responding",
                lastActive: responding ? "Just now" : UNKNOWN,
                source: responding
                    ? "Application responded to this page's telemetry request."
                    : "Application did not respond to the telemetry request.",
                action: responding ? "No action required." : "Check the Laravel service and database.",
                connectionStatus: responding ? "Application responding" : "No response",
                firmware: UNKNOWN,
                serialPort: device.serialPort || UNKNOWN,
                uptime: UNKNOWN,
                calibration: UNKNOWN,
                healthScore: null,
                totalReadings: null,
                totalErrors: null,
                telemetry: [{ label: "Application", value: responding ? "Responding" : "No response", unit: "" }],
                logs: [responding ? "Telemetry endpoint responded" : "Telemetry endpoint unreachable"],
            };
        }

        // Devices the firmware never reports on (USB HID scanner, browser-side
        // presence detection). Claiming a status for these would be a guess.
        if (!device.sensorKey && !device.isController) {
            return {
                ...device,
                status: "Not Reported",
                health: UNKNOWN,
                lastActive: UNKNOWN,
                source: device.notReportedReason,
                action: "Verify physically at the kiosk.",
                connectionStatus: UNKNOWN,
                firmware: UNKNOWN,
                serialPort: device.serialPort || UNKNOWN,
                uptime: UNKNOWN,
                calibration: UNKNOWN,
                healthScore: null,
                totalReadings: null,
                totalErrors: null,
                telemetry: [{ label: "Telemetry", value: "Not reported by firmware", unit: "" }],
                logs: [device.notReportedReason],
            };
        }

        // The controller itself: its health *is* the link health.
        if (device.isController) {
            return {
                ...device,
                status: linkUp ? "Online" : "No Telemetry",
                health: linkUp ? "Reporting" : "No heartbeat",
                lastActive: lastSeen,
                source: linkUp
                    ? `Serial bridge reporting. Machine state: ${machineState || "IDLE"}.`
                    : "No telemetry received from the kiosk firmware.",
                action: linkUp
                    ? "No action required."
                    : "Check USB cable, COM port, Python bridge service, and firmware upload.",
                connectionStatus: linkUp ? "Heartbeat received" : "No serial heartbeat",
                firmware: UNKNOWN,
                serialPort: UNKNOWN,
                uptime: UNKNOWN,
                calibration: UNKNOWN,
                healthScore: null,
                totalReadings: null,
                totalErrors: null,
                telemetry: [
                    { label: "Link", value: linkUp ? "Connected" : "No telemetry", unit: "" },
                    { label: "Machine State", value: machineState || UNKNOWN, unit: "" },
                    { label: "Active Sensor", value: activeSensor || "None", unit: "" },
                ],
                logs: [
                    `Last telemetry: ${lastSeen}`,
                    `Machine state: ${machineState || UNKNOWN}`,
                    error ? `Reported error: ${error}` : "No error reported",
                ],
            };
        }

        // A measured sensor. The firmware reports one active sensor at a time,
        // so "not active" means idle, not faulty — saying otherwise would be
        // inventing a fault.
        const isActive = linkUp && activeSensor === device.sensorKey;
        const hasError = isActive && Boolean(error);
        const live = isActive ? telemetry?.live_data : null;

        let status = "No Telemetry";
        if (linkUp) status = hasError ? "Warning" : isActive ? "Online" : "Standby";

        return {
            ...device,
            status,
            health: linkUp ? (isActive ? "Reporting now" : "Idle") : "No heartbeat",
            lastActive: linkUp ? (isActive ? "Reporting now" : lastSeen) : lastSeen,
            source: !linkUp
                ? "No telemetry received from the kiosk firmware."
                : hasError
                    ? `Firmware reported: ${error}`
                    : isActive
                        ? "Currently streaming readings."
                        : "Board is connected. This sensor is idle until a measurement starts.",
            action: !linkUp
                ? "Check the Mega Board connection first."
                : hasError
                    ? "Inspect wiring and re-run the measurement."
                    : "No action required.",
            connectionStatus: linkUp ? "Via Mega Board" : "No serial heartbeat",
            firmware: UNKNOWN,
            serialPort: device.serialPort || UNKNOWN,
            uptime: UNKNOWN,
            calibration: UNKNOWN,
            healthScore: null,
            totalReadings: null,
            totalErrors: null,
            telemetry: [
                { label: "Primary", value: live?.primary ?? (isActive ? "--" : "No signal"), unit: device.primaryUnit || "" },
                ...(device.secondaryUnit
                    ? [{ label: "Secondary", value: live?.secondary ?? (isActive ? "--" : "No signal"), unit: device.secondaryUnit }]
                    : []),
            ],
            logs: [
                `Last telemetry: ${lastSeen}`,
                isActive ? "Selected as the active sensor" : "Not the active sensor",
                error && isActive ? `Reported error: ${error}` : "No error reported",
            ],
        };
    });
}
