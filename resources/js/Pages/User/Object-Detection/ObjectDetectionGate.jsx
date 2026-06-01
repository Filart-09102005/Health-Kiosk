import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, CheckCircle2, MoveHorizontal, UserRoundSearch, WifiOff } from "lucide-react";
import Idle from "../../Kiosk-Idle/Idle.jsx";

const POLL_INTERVAL_MS = 500;
const RETURN_TO_IDLE_MS = 5000;
const DEFAULT_STATUS_URLS = [
    "/object-detection/status.json",
    "/status.json",
];

const statusCopy = {
    NO_STUDENT: {
        title: "Waiting for User",
        description: "Stand in front of the kiosk to begin.",
        icon: UserRoundSearch,
        tone: "text-blue-700",
    },
    MOVE_TO_CENTER: {
        title: "Please move to center",
        description: "Position yourself inside the camera guide zone.",
        icon: MoveHorizontal,
        tone: "text-amber-600",
    },
    HOLD_STILL: {
        title: "Hold still",
        description: "Keep your position while the kiosk confirms detection.",
        icon: Camera,
        tone: "text-sky-700",
    },
    READY: {
        title: "Ready",
        description: "Please scan your barcode or login.",
        icon: CheckCircle2,
        tone: "text-emerald-600",
    },
    UNAVAILABLE: {
        title: "Detection unavailable",
        description: "Tap the screen to continue manually.",
        icon: WifiOff,
        tone: "text-slate-600",
    },
};

async function readDetectionStatus(urls) {
    let lastError;

    for (const url of urls) {
        try {
            const response = await fetch(`${url}?t=${Date.now()}`, {
                cache: "no-store",
                headers: { Accept: "application/json" },
            });

            if (!response.ok) {
                throw new Error(`Detection status unavailable at ${url}`);
            }

            return response.json();
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error("Detection status unavailable");
}

function normalizeStatus(value) {
    const status = String(value || "UNAVAILABLE").toUpperCase();
    return statusCopy[status] ? status : "UNAVAILABLE";
}

function normalizeProgress(value) {
    const numericValue = Number(value || 0);
    const percentage = numericValue <= 1 ? numericValue * 100 : numericValue;

    return Math.max(0, Math.min(100, percentage));
}

export default function ObjectDetectionGate({
    children,
    navigate,
    statusUrls = DEFAULT_STATUS_URLS,
}) {
    const [detection, setDetection] = useState({ status: "UNAVAILABLE", hold_progress: 0 });
    const [loginVisible, setLoginVisible] = useState(false);
    const [manualOverride, setManualOverride] = useState(false);
    const loginVisibleRef = useRef(loginVisible);
    const manualOverrideRef = useRef(manualOverride);
    const noStudentSinceRef = useRef(Date.now());

    useEffect(() => {
        loginVisibleRef.current = loginVisible;
    }, [loginVisible]);

    useEffect(() => {
        manualOverrideRef.current = manualOverride;
    }, [manualOverride]);

    const showLoginManually = useCallback(() => {
        noStudentSinceRef.current = null;
        setManualOverride(true);
        setLoginVisible(true);
    }, []);

    useEffect(() => {
        let cancelled = false;

        const applyStatus = (payload) => {
            const status = normalizeStatus(payload?.status);
            const nextDetection = {
                ...payload,
                status,
                hold_progress: normalizeProgress(payload?.hold_progress),
            };

            setDetection(nextDetection);

            if (status === "READY") {
                noStudentSinceRef.current = null;
                setManualOverride(false);
                setLoginVisible(true);
                return;
            }

            if (status === "NO_STUDENT" || status === "UNAVAILABLE") {
                if (!noStudentSinceRef.current) {
                    noStudentSinceRef.current = Date.now();
                }

                if (loginVisibleRef.current && Date.now() - noStudentSinceRef.current >= RETURN_TO_IDLE_MS) {
                    setManualOverride(false);
                    setLoginVisible(false);
                }

                return;
            }

            noStudentSinceRef.current = null;

            if (!manualOverrideRef.current) {
                setLoginVisible(false);
            }
        };

        const poll = async () => {
            try {
                const payload = await readDetectionStatus(statusUrls);
                if (!cancelled) applyStatus(payload);
            } catch {
                if (!cancelled) {
                    applyStatus({ status: "UNAVAILABLE", hold_progress: 0 });
                }
            }
        };

        poll();
        const timer = window.setInterval(poll, POLL_INTERVAL_MS);

        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [statusUrls]);

    const detectionStatus = normalizeStatus(detection.status);
    const copy = useMemo(() => statusCopy[detectionStatus] || statusCopy.UNAVAILABLE, [detectionStatus]);
    const StatusIcon = copy.icon;
    const showHoldProgress = detectionStatus === "HOLD_STILL";

    if (loginVisible) {
        return (
            <div className="relative min-h-screen bg-slate-950">
                {children}
                <div className="pointer-events-none fixed left-1/2 top-5 z-50 w-[min(92vw,34rem)] -translate-x-1/2 rounded-2xl border border-blue-100/80 bg-white/95 px-5 py-4 text-slate-900 shadow-2xl shadow-blue-200/40 backdrop-blur">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <CheckCircle2 size={23} />
                        </div>
                        <div>
                            <p className="text-sm font-black uppercase tracking-[0.16em] text-blue-600">
                                {manualOverride ? "Manual access" : "Object detection ready"}
                            </p>
                            <p className="text-base font-black">
                                {manualOverride ? "Please scan your barcode or login." : "Ready. Please scan your barcode or login."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#eef7ff]">
            <Idle navigate={showLoginManually} />

            <button
                type="button"
                aria-label="Open login manually"
                onClick={showLoginManually}
                className="absolute inset-0 z-20 cursor-pointer bg-transparent"
            />

            <section className="pointer-events-none absolute bottom-8 left-1/2 z-30 w-[min(92vw,34rem)] -translate-x-1/2 rounded-3xl border border-white/80 bg-white/95 p-5 text-center text-slate-950 shadow-2xl shadow-blue-200/50 backdrop-blur">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <StatusIcon size={31} />
                </div>

                <p className={`mt-4 text-2xl font-black tracking-tight ${copy.tone}`}>
                    {copy.title}
                </p>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
                    {copy.description}
                </p>

                {showHoldProgress ? (
                    <div className="mt-5">
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-blue-600 transition-[width] duration-500 ease-out"
                                style={{ width: `${detection.hold_progress}%` }}
                            />
                        </div>
                        <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                            Stabilizing {Math.round(detection.hold_progress)}%
                        </p>
                    </div>
                ) : null}

                <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                    Tap anywhere to continue manually
                </p>
            </section>
        </div>
    );
}
