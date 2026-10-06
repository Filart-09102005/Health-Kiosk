import { Activity, HeartPulse, RefreshCw, ShieldCheck, WifiOff } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import AdminModulePage from "../components/AdminModulePage";

const POLL_INTERVAL_MS = 2000;
const API_URL = "/api/kiosk/live-vitals";

const medicalTheme = {
    page: "#f5fffc",
    card: "#ffffff",
    surface: "#ecfdf5",
    border: "#ccefe6",
    text: "#0f332f",
    muted: "#5f7f78",
    blue: "#2563eb",
    green: "#16a34a",
    yellow: "#d97706",
    red: "#dc2626",
};

export default function LiveVitals() {
    const [vitals, setVitals] = useState({ heart_rate: null, spo2: null, updated_at: null });
    const [lastFetchedAt, setLastFetchedAt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const requestRef = useRef(null);

    const spo2Status = useMemo(() => getSpo2Status(vitals.spo2), [vitals.spo2]);
    const heartRateStatus = Number.isFinite(Number(vitals.heart_rate)) ? "Receiving" : "Waiting";

    useEffect(() => {
        let alive = true;
        let timer = null;

        const fetchVitals = async () => {
            requestRef.current?.abort();
            const controller = new AbortController();
            requestRef.current = controller;

            try {
                const response = await fetch(`${API_URL}?_=${Date.now()}`, {
                    signal: controller.signal,
                    cache: "no-store",
                    headers: {
                        Accept: "application/json",
                        "Cache-Control": "no-cache, no-store, must-revalidate",
                        Pragma: "no-cache",
                    },
                });

                if (!response.ok) {
                    throw new Error("Live vitals request failed.");
                }

                const data = await response.json();
                if (!alive) return;

                setVitals({
                    heart_rate: normalizeNumber(data.heart_rate),
                    spo2: normalizeNumber(data.spo2),
                    updated_at: data.updated_at || null,
                });
                setLastFetchedAt(new Date());
                setError("");
            } catch (fetchError) {
                if (fetchError.name !== "AbortError" && alive) {
                    setError("Live sensor feed unavailable");
                    setLastFetchedAt(new Date());
                }
            } finally {
                if (!alive) return;
                setLoading(false);
                timer = window.setTimeout(fetchVitals, POLL_INTERVAL_MS);
            }
        };

        fetchVitals();

        return () => {
            alive = false;
            if (timer) window.clearTimeout(timer);
            requestRef.current?.abort();
        };
    }, []);

    return (
        <AdminModulePage
            icon={HeartPulse}
            eyebrow="Live IoT Monitor"
            title="Real-time Health Monitoring"
            description="USB-connected Arduino Mega vitals feed from the serial-to-Python bridge."
            showHeaderActions={false}
            stats={[
                { label: "Polling Rate", value: "2s", caption: "Live API refresh interval", icon: RefreshCw },
                { label: "SpO2 State", value: spo2Status.label, caption: spo2Status.caption, icon: ShieldCheck },
                { label: "Pulse Feed", value: heartRateStatus, caption: "Arduino Mega serial bridge", icon: Activity },
                { label: "Cache Mode", value: "No-store", caption: "Fresh API request every cycle", icon: WifiOff },
            ]}
        >
            <section className="rounded-[18px] border p-5 hk-admin-card" style={{ backgroundColor: medicalTheme.page, borderColor: medicalTheme.border, color: medicalTheme.text }}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: medicalTheme.blue }}>
                            Patient vitals
                        </p>
                        <h3 className="mt-2 text-2xl font-black">Live sensor readings</h3>
                    </div>
                    <div className="rounded-2xl border px-4 py-3 text-right text-xs font-black" style={{ backgroundColor: medicalTheme.card, borderColor: medicalTheme.border, color: medicalTheme.muted }}>
                        <p>Last updated</p>
                        <p className="mt-1 text-sm" style={{ color: medicalTheme.text }}>{formatTimestamp(vitals.updated_at, lastFetchedAt)}</p>
                    </div>
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                    <VitalDisplayCard
                        title="Heart Rate"
                        value={vitals.heart_rate}
                        unit="BPM"
                        icon={HeartPulse}
                        color={medicalTheme.blue}
                        helper={loading ? "Connecting to pulse sensor" : "Pulse value from live API"}
                    />
                    <VitalDisplayCard
                        title="SpO2"
                        value={vitals.spo2}
                        unit="%"
                        icon={ShieldCheck}
                        color={spo2Status.color}
                        helper={spo2Status.caption}
                    />
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_18rem]">
                    <article className="rounded-2xl border p-4" style={{ backgroundColor: medicalTheme.card, borderColor: medicalTheme.border }}>
                        <div className="flex flex-wrap items-center gap-3">
                            <StatusDot color={error ? medicalTheme.red : spo2Status.color} />
                            <div>
                                <p className="text-sm font-black">{error || spo2Status.label}</p>
                                <p className="mt-1 text-xs font-bold" style={{ color: medicalTheme.muted }}>
                                    {error ? "Check the Python bridge, serial port, and backend endpoint." : "Data is refreshed from the latest backend API response."}
                                </p>
                            </div>
                        </div>
                    </article>

                    <article className="rounded-2xl border p-4" style={{ backgroundColor: medicalTheme.card, borderColor: medicalTheme.border }}>
                        <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: medicalTheme.muted }}>API Source</p>
                        <p className="mt-2 text-sm font-black" style={{ color: medicalTheme.blue }}>{API_URL}</p>
                    </article>
                </div>
            </section>
        </AdminModulePage>
    );
}

function VitalDisplayCard({ title, value, unit, icon: Icon, color, helper }) {
    const hasValue = Number.isFinite(Number(value));

    return (
        <article className="relative overflow-hidden rounded-[22px] border p-6 shadow-sm" style={{ backgroundColor: medicalTheme.card, borderColor: medicalTheme.border }}>
            <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-[4rem]" style={{ backgroundColor: `${color}14` }} />
            <div className="relative flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-black uppercase tracking-[0.16em]" style={{ color: medicalTheme.muted }}>{title}</p>
                    <div className="mt-5 flex items-end gap-3">
                        <span className="text-7xl font-black leading-none md:text-8xl" style={{ color }}>
                            {hasValue ? Math.round(Number(value)) : "--"}
                        </span>
                        <span className="pb-3 text-2xl font-black" style={{ color: medicalTheme.text }}>{unit}</span>
                    </div>
                    <p className="mt-5 text-sm font-bold" style={{ color: medicalTheme.muted }}>{helper}</p>
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: `${color}14`, color }}>
                    <Icon size={34} />
                </div>
            </div>
        </article>
    );
}

function StatusDot({ color }) {
    return (
        <span className="relative flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-30" style={{ backgroundColor: color }} />
            <span className="relative inline-flex h-4 w-4 rounded-full" style={{ backgroundColor: color }} />
        </span>
    );
}

function getSpo2Status(spo2) {
    const value = Number(spo2);

    if (!Number.isFinite(value)) {
        return { label: "Waiting", caption: "No SpO2 reading yet", color: medicalTheme.blue };
    }

    if (value < 90) {
        return { label: "Critical", caption: "Critical oxygen level", color: medicalTheme.red };
    }

    if (value < 94) {
        return { label: "Warning", caption: "Low oxygen warning", color: medicalTheme.yellow };
    }

    return { label: "Normal", caption: "Oxygen level within range", color: medicalTheme.green };
}

function normalizeNumber(value) {
    const number = Number(value);

    return Number.isFinite(number) ? number : null;
}

function formatTimestamp(apiTimestamp, fallbackDate) {
    const source = apiTimestamp ? new Date(apiTimestamp) : fallbackDate;

    if (!source || Number.isNaN(source.getTime())) {
        return "Waiting for data";
    }

    return source.toLocaleString("en-PH", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone: "Asia/Manila",
    });
}
