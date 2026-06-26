import { useEffect, useRef, useState } from "react";
import { Camera, UserRoundSearch, WifiOff } from "lucide-react";
import Idle from "../../../Kiosk-Idle/Idle.jsx";
import { useAssistant } from "../context/AssistantProvider";
import useFacePresenceDetection from "../hooks/useFacePresenceDetection";

const IDLE_AFTER_NO_USER_MS = 30000;

export default function AssistantIdleGate({ children }) {
    const { enabled, speak } = useAssistant();
    const [loginVisible, setLoginVisible] = useState(false);
    const noUserSinceRef = useRef(Date.now());
    const wasVisibleRef = useRef(false);
    const detection = useFacePresenceDetection({ enabled });

    useEffect(() => {
        if (!enabled) {
            setLoginVisible(true);
            noUserSinceRef.current = null;
            return;
        }

        if (detection.userDetected) {
            noUserSinceRef.current = null;
            setLoginVisible(true);
            return;
        }

        if (!noUserSinceRef.current) {
            noUserSinceRef.current = Date.now();
        }

        const timer = window.setInterval(() => {
            if (detection.userDetected) return;

            if (noUserSinceRef.current && Date.now() - noUserSinceRef.current >= IDLE_AFTER_NO_USER_MS) {
                setLoginVisible(false);
            }
        }, 1000);

        return () => window.clearInterval(timer);
    }, [detection.userDetected, enabled]);

    useEffect(() => {
        if (!enabled) return;

        if (loginVisible && !wasVisibleRef.current) {
            speak("welcome");
        }

        wasVisibleRef.current = loginVisible;
    }, [enabled, loginVisible, speak]);

    const openManually = () => {
        noUserSinceRef.current = null;
        setLoginVisible(true);
    };

    if (loginVisible) {
        return (
            <div className="relative min-h-screen">
                <HiddenCamera videoRef={detection.videoRef} />
                {children}
                {enabled ? <DetectionBadge detection={detection} /> : null}
            </div>
        );
    }

    return (
        <div className="relative min-h-screen overflow-hidden" style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 8%, #ffffff)" }}>
            <HiddenCamera videoRef={detection.videoRef} />
            <Idle navigate={openManually} />

            <button
                type="button"
                aria-label="Open login manually"
                onClick={openManually}
                className="absolute inset-0 z-20 cursor-pointer bg-transparent"
            />

            <section className="pointer-events-none absolute bottom-8 left-1/2 z-30 w-[min(92vw,34rem)] -translate-x-1/2 rounded-3xl border border-white/80 bg-white/95 p-5 text-center text-slate-950 shadow-2xl backdrop-blur" style={{ boxShadow: "0 24px 60px color-mix(in srgb, var(--color-primary) 18%, transparent)" }}>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, #ffffff)", color: "var(--color-primary)" }}>
                    {detection.detectionSupported && !detection.permissionDenied ? <UserRoundSearch size={31} /> : <WifiOff size={31} />}
                </div>
                <p className="mt-4 text-2xl font-black tracking-tight" style={{ color: "var(--color-primary)" }}>
                    Waiting for User
                </p>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
                    Assistant Mode is watching for a nearby face using the front camera. Tap anywhere to continue manually.
                </p>
                <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                    Idle mode after 30 seconds with no user detected
                </p>
            </section>
        </div>
    );
}

function HiddenCamera({ videoRef }) {
    return (
        <video
            ref={videoRef}
            muted
            playsInline
            aria-hidden="true"
            className="pointer-events-none fixed h-px w-px opacity-0"
            style={{ left: -1, top: -1 }}
        />
    );
}

function DetectionBadge({ detection }) {
    const Icon = detection.cameraReady ? Camera : WifiOff;
    const label = detection.userDetected
        ? "User detected"
        : detection.permissionDenied
            ? "Camera permission needed"
            : detection.detectionSupported
                ? "Watching for user"
                : "Face detection unavailable";

    return (
        <div className="pointer-events-none fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-2xl border bg-white/95 px-4 py-3 text-slate-900 shadow-2xl backdrop-blur" style={{ borderColor: "color-mix(in srgb, var(--color-primary) 18%, transparent)", boxShadow: "0 24px 60px color-mix(in srgb, var(--color-primary) 18%, transparent)" }}>
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, #ffffff)", color: "var(--color-primary)" }}>
                    <Icon size={20} />
                </div>
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--color-primary)" }}>Assistant idle detection</p>
                    <p className="text-sm font-black">{label}</p>
                </div>
            </div>
        </div>
    );
}
