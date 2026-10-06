import { useCallback, useEffect, useState } from "react";

export const MEASUREMENT_MODES = {
    SMART: "smart",
    MANUAL: "manual",
};

// Smart Mode is the kiosk's primary way of working; Manual Mode exists as a
// fallback for when a sensor is unavailable or the reading came from an
// external medical device. Every new session therefore starts on Smart.
export const DEFAULT_MEASUREMENT_MODE = MEASUREMENT_MODES.SMART;

// Scoped per kiosk session, and to sessionStorage rather than localStorage.
//
// The kiosk is a shared terminal: one browser tab serves many people in a row,
// and sessionStorage alone survives logout, so an unscoped key would hand the
// next person the previous person's mode. Keying on the session id means a new
// session falls back to Smart on its own, while the choice still survives page
// navigation and an accidental reload within the same session.
const STORAGE_PREFIX = "hk_measurement_mode";

const isValidMode = (value) => Object.values(MEASUREMENT_MODES).includes(value);

const storageKeyFor = (sessionId) => `${STORAGE_PREFIX}_${sessionId}`;

function readStoredMode(key) {
    try {
        const stored = window.sessionStorage.getItem(key);
        return isValidMode(stored) ? stored : null;
    } catch {
        // Private browsing or a blocked storage API — treat as "nothing stored"
        // rather than breaking the page over a preference.
        return null;
    }
}

// A kiosk tab can stay open across many sessions; drop the keys belonging to
// sessions that have already ended so they do not accumulate.
function pruneOtherSessions(currentKey) {
    try {
        const stale = [];
        for (let i = 0; i < window.sessionStorage.length; i += 1) {
            const key = window.sessionStorage.key(i);
            if (key?.startsWith(STORAGE_PREFIX) && key !== currentKey) stale.push(key);
        }
        stale.forEach((key) => window.sessionStorage.removeItem(key));
    } catch {
        // Non-fatal — leftover keys are harmless.
    }
}

/**
 * @param sessionId  Active kiosk session id. May be undefined on first render
 *                   while the session is still loading.
 */
export function useMeasurementMode(sessionId) {
    const [mode, setModeState] = useState(DEFAULT_MEASUREMENT_MODE);

    useEffect(() => {
        if (!sessionId) return;

        const key = storageKeyFor(sessionId);
        pruneOtherSessions(key);

        const stored = readStoredMode(key);

        // Only a value stored against *this* session may override what is
        // already on screen. Without that guard, a mode picked while the
        // session was still loading would be silently reverted the moment it
        // arrived.
        if (stored) setModeState(stored);
    }, [sessionId]);

    useEffect(() => {
        if (!sessionId) return;

        try {
            window.sessionStorage.setItem(storageKeyFor(sessionId), mode);
        } catch {
            // Non-fatal: the mode still applies to this page view, it just
            // will not survive a reload.
        }
    }, [sessionId, mode]);

    const setMode = useCallback((next) => {
        if (isValidMode(next)) setModeState(next);
    }, []);

    /**
     * Resolve the mode for one specific measurement type.
     *
     * This version is session-wide, so `type` is accepted but does not change
     * the answer yet. Callers still ask per-measurement ("what mode for THIS
     * check?") so that introducing per-measurement overrides later is a change
     * to this hook alone — the flow shell and picker keep calling it unchanged.
     */
    const getModeFor = useCallback((type) => mode, [mode]); // eslint-disable-line no-unused-vars

    return { mode, setMode, getModeFor };
}
