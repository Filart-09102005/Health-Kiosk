import { useCallback, useEffect, useRef, useState } from "react";

const DETECTION_INTERVAL_MS = 900;

export default function useFacePresenceDetection({ enabled = true } = {}) {
    const [state, setState] = useState({
        cameraReady: false,
        detectionSupported: false,
        permissionDenied: false,
        userDetected: false,
    });
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const detectorRef = useRef(null);

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks?.().forEach((track) => track.stop());
        streamRef.current = null;
    }, []);

    useEffect(() => {
        if (!enabled || typeof window === "undefined") {
            stopCamera();
            return undefined;
        }

        let cancelled = false;
        let timer = null;

        const start = async () => {
            const detectionSupported = "FaceDetector" in window;
            setState((current) => ({ ...current, detectionSupported }));

            if (!detectionSupported || !navigator.mediaDevices?.getUserMedia) {
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: "user",
                        width: { ideal: 320 },
                        height: { ideal: 240 },
                    },
                    audio: false,
                });

                if (cancelled) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }

                streamRef.current = stream;
                detectorRef.current = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }

                setState((current) => ({ ...current, cameraReady: true, permissionDenied: false }));

                const detect = async () => {
                    if (cancelled || !videoRef.current || !detectorRef.current) return;

                    try {
                        const faces = await detectorRef.current.detect(videoRef.current);
                        if (!cancelled) {
                            setState((current) => ({ ...current, userDetected: faces.length > 0 }));
                        }
                    } catch {
                        if (!cancelled) {
                            setState((current) => ({ ...current, userDetected: false }));
                        }
                    }
                };

                await detect();
                timer = window.setInterval(detect, DETECTION_INTERVAL_MS);
            } catch {
                if (!cancelled) {
                    setState((current) => ({ ...current, cameraReady: false, permissionDenied: true, userDetected: false }));
                }
            }
        };

        start();

        return () => {
            cancelled = true;
            if (timer) window.clearInterval(timer);
            stopCamera();
        };
    }, [enabled, stopCamera]);

    return { ...state, videoRef };
}
