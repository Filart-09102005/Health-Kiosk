import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import Idle from "../../Kiosk-Idle/Idle.jsx";

const POLL_INTERVAL_MS = 500;
const RETURN_TO_IDLE_MS = 5000;
const READY_GUIDE_VISIBLE_MS = 4500;
const DEFAULT_STATUS_URLS = [
    "/object-detection/status.json",
    "/status.json",
];

const statusCopy = {
    NO_STUDENT: true,
    MOVE_TO_CENTER: true,
    HOLD_STILL: true,
    READY: true,
    UNAVAILABLE: true,
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
    const [readyGuideVisible, setReadyGuideVisible] = useState(false);
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

    useEffect(() => {
        if (!loginVisible) {
            setReadyGuideVisible(false);
            return undefined;
        }

        setReadyGuideVisible(true);
        const timer = window.setTimeout(() => {
            setReadyGuideVisible(false);
        }, READY_GUIDE_VISIBLE_MS);

        return () => window.clearTimeout(timer);
    }, [loginVisible, manualOverride]);

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

    if (loginVisible) {
        return (
            <div className="relative min-h-screen bg-slate-950">
                {children}
                {readyGuideVisible ? (
                    <div className="pointer-events-none fixed left-1/2 top-5 z-50 w-[min(92vw,34rem)] -translate-x-1/2 overflow-hidden rounded-2xl border bg-white/95 text-slate-900 shadow-2xl backdrop-blur" style={{ borderColor: "color-mix(in srgb, var(--color-primary) 18%, transparent)", boxShadow: "0 24px 60px color-mix(in srgb, var(--color-primary) 18%, transparent)" }}>
                        <div className="px-5 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, #ffffff)", color: "var(--color-primary)" }}>
                                    <CheckCircle2 size={23} />
                                </div>
                                <div>
                                    <p className="text-sm font-black uppercase tracking-[0.16em]" style={{ color: "var(--color-primary)" }}>
                                        {manualOverride ? "Manual access" : "Barcode scanning ready"}
                                    </p>
                                    <p className="text-base font-black">
                                        {manualOverride ? "Scan your barcode or use login." : "User detected. Scan your barcode to continue."}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="h-1 w-full" style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, #ffffff)" }}>
                            <div className="hk-auth-ready-guide-progress h-full" style={{ backgroundColor: "var(--color-primary)" }} />
                        </div>
                    </div>
                ) : null}
            </div>
        );
    }

    return (
        <div className="relative min-h-screen overflow-hidden" style={{ backgroundColor: "var(--color-bg)" }}>
            <Idle navigate={showLoginManually} />

            <button
                type="button"
                aria-label="Open login manually"
                onClick={showLoginManually}
                className="absolute inset-0 z-20 cursor-pointer bg-transparent"
            />
        </div>
    );
}
