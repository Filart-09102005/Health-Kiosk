import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { HeartPulse, Ruler, Scale, Thermometer } from "lucide-react";
import { authService } from "../Pages/Auth/services/authService";

/**
 * Shared registry + client for Measurement Availability.
 *
 * Mirrors App\Services\Health\MeasurementAvailabilityService on the server:
 * Smart Mode is administrator-controlled per sensor, Manual Mode is always on
 * and is never sent, stored or toggled.
 *
 * Adding a future measurement (blood pressure, blood glucose, vision, ECG…) is
 * one entry in MEASUREMENT_CATALOG plus the matching key in the PHP registry —
 * the admin panel, the modal and the user-side guard all read from here.
 */

export const MEASUREMENT_CATALOG = [
    {
        key: "heart_rate",
        label: "Heart Rate & SpO2",
        description: "Pulse and oxygen saturation from the fingertip oximeter.",
        icon: HeartPulse,
        accent: "#ef4444",
    },
    {
        key: "temperature",
        label: "Temperature",
        description: "Body temperature from the infrared sensor.",
        icon: Thermometer,
        accent: "#f97316",
    },
    {
        key: "height",
        label: "Height",
        description: "Standing height from the ultrasonic distance sensor.",
        icon: Ruler,
        accent: "#f59e0b",
    },
    {
        key: "weight",
        label: "Weight",
        description: "Body weight from the load-cell platform.",
        icon: Scale,
        accent: "#10b981",
    },
];

export const MEASUREMENT_KEYS = MEASUREMENT_CATALOG.map((item) => item.key);

export const getMeasurementCatalogEntry = (key) =>
    MEASUREMENT_CATALOG.find((item) => item.key === key) || null;

/**
 * Optimistic default: every sensor is usable until the server says otherwise,
 * so a slow or failed availability request never blocks a working kiosk.
 */
export const DEFAULT_AVAILABILITY = Object.fromEntries(
    MEASUREMENT_CATALOG.map((item) => [
        item.key,
        { label: item.label, smart_enabled: true, manual_enabled: true },
    ]),
);

export function normalizeAvailability(raw) {
    if (!raw || typeof raw !== "object") return DEFAULT_AVAILABILITY;

    return Object.fromEntries(
        MEASUREMENT_CATALOG.map((item) => {
            const entry = raw[item.key];

            return [
                item.key,
                {
                    label: item.label,
                    smart_enabled: entry ? entry.smart_enabled !== false : true,
                    // Constant by design; normalised here so a malformed
                    // payload can never take Manual Mode away.
                    manual_enabled: true,
                },
            ];
        }),
    );
}

export const isSmartEnabled = (availability, key) =>
    (availability || DEFAULT_AVAILABILITY)[key]?.smart_enabled !== false;

export const disabledSmartKeys = (availability) =>
    MEASUREMENT_KEYS.filter((key) => !isSmartEnabled(availability, key));

/**
 * Fired after an admin saves, so any availability consumer mounted in the same
 * tab refreshes without waiting for its next poll.
 */
export const AVAILABILITY_CHANGED_EVENT = "hk-measurement-availability-changed";

/**
 * Same guard every other mutating call in this app uses: a session that has
 * been open a while can hold a stale XSRF cookie, and the first write after
 * that comes back 419. Refresh the cookie once and retry before giving up.
 */
const withCsrf = async (request) => {
    await authService.ensureCsrfCookie();

    try {
        return await request();
    } catch (error) {
        if (error?.response?.status === 419) {
            await authService.ensureCsrfCookie({ refresh: true });
            return request();
        }

        throw error;
    }
};

export const measurementAvailabilityService = {
    fetch(signal) {
        return axios.get("/api/measurement-availability", { signal });
    },

    update(availability) {
        return withCsrf(() =>
            axios.put("/api/admin/measurement-availability", { availability }),
        ).then((response) => {
            window.dispatchEvent(new Event(AVAILABILITY_CHANGED_EVENT));
            return response;
        });
    },
};

// The kiosk picker can sit on screen for a while; a slow poll means an admin
// taking a sensor down for maintenance is reflected without anyone reloading.
const POLL_INTERVAL_MS = 30000;

/**
 * @param {boolean} enabled  Pass false to stop polling while the screen that
 *                           needs availability is not visible.
 */
export function useMeasurementAvailability(enabled = true) {
    const [availability, setAvailability] = useState(DEFAULT_AVAILABILITY);
    const [loading, setLoading] = useState(true);
    const aliveRef = useRef(true);

    const load = useCallback((signal) => {
        return measurementAvailabilityService
            .fetch(signal)
            .then((response) => {
                if (!aliveRef.current) return;
                setAvailability(normalizeAvailability(response.data?.availability));
            })
            .catch(() => {
                // Availability is an enhancement, not a gate: on failure the
                // kiosk keeps its optimistic defaults rather than blocking
                // measurements the sensors can still take.
            })
            .finally(() => {
                if (aliveRef.current) setLoading(false);
            });
    }, []);

    useEffect(() => {
        aliveRef.current = true;

        if (!enabled) {
            setLoading(false);
            return () => {
                aliveRef.current = false;
            };
        }

        const controller = new AbortController();
        load(controller.signal);

        const timer = window.setInterval(() => {
            if (document.visibilityState === "visible") load();
        }, POLL_INTERVAL_MS);

        const onChanged = () => load();
        window.addEventListener(AVAILABILITY_CHANGED_EVENT, onChanged);

        return () => {
            aliveRef.current = false;
            controller.abort();
            window.clearInterval(timer);
            window.removeEventListener(AVAILABILITY_CHANGED_EVENT, onChanged);
        };
    }, [enabled, load]);

    return { availability, loading, refresh: () => load() };
}
