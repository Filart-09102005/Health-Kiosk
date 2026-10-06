import { useSyncExternalStore } from "react";
import { MonitorCog, Moon, Sun, Palette } from "lucide-react";

/**
 * The interface theme.
 *
 * This is deliberately a plain module-level store that React subscribes to,
 * rather than useState inside the hook. The previous version gave every caller
 * — the app root, the header toggle, the Appearance drawer, a chart — its own
 * copy of `mode`, and each copy wrote both the <html> attribute and
 * localStorage. That had two failure modes the kiosk actually hit:
 *
 *  1. A copy that had not been told about a change would re-apply its stale
 *     mode on its next render, so the DOM could say "dark" while the toggle
 *     icon said "light".
 *  2. Applying a resolved theme also *saved* it, so "system" could be written
 *     over an explicit Light choice — and on a device set to dark, the next
 *     refresh came back dark.
 *
 * One store, one writer, and saving only when a person actually chooses.
 * `main.blade.php` runs the same resolution inline before the first paint;
 * keep the two in step.
 */

export const THEME_STORAGE_KEY = "health-kiosk-theme";
export const THEME_CHANGE_EVENT = "health-kiosk-theme-change";

// The original three modes. Left exactly as-is — this is still what the
// compact header toggle cycles through, so that button's behavior is
// unchanged regardless of how many named themes exist.
export const themeModes = ["system", "light", "dark"];

// Named themes selectable from the Appearance drawer, in addition to the
// three modes above. Each one resolves to itself (see resolveTheme) and is
// backed by a matching [data-theme="..."] block in app.css.
export const customThemeModes = [
    "valentine", "lemonade", "caramellatte", "aqua", "emerald",
    "cupcake", "retro", "garden", "halloween", "lofi", "luxury", "autumn", "abyss",
];

// Every value setThemeMode()/readStoredMode() will accept.
export const allThemeModes = [...themeModes, ...customThemeModes];

const prefersDark = () =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
        : false;

const resolveTheme = (mode) => (mode === "system" ? (prefersDark() ? "dark" : "light") : mode);

function readStoredMode() {
    try {
        const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
        return allThemeModes.includes(stored) ? stored : "system";
    } catch {
        // Storage can be blocked; the device preference is a fine fallback.
        return "system";
    }
}

let currentMode = typeof window === "undefined" ? "system" : readStoredMode();
let snapshot = { mode: currentMode, resolvedTheme: resolveTheme(currentMode) };
const listeners = new Set();

/**
 * Put the resolved theme on <html>.
 *
 * Written unconditionally rather than only on change, so anything that clobbers
 * the attribute is corrected the next time the store is consulted.
 */
function paint() {
    if (typeof document === "undefined") return snapshot.resolvedTheme;

    const resolved = resolveTheme(currentMode);
    const root = document.documentElement;

    if (root.getAttribute("data-theme") !== resolved) root.setAttribute("data-theme", resolved);
    if (root.getAttribute("data-theme-mode") !== currentMode) root.setAttribute("data-theme-mode", currentMode);

    return resolved;
}

function publish() {
    const resolved = paint();

    if (snapshot.mode === currentMode && snapshot.resolvedTheme === resolved) return;

    snapshot = { mode: currentMode, resolvedTheme: resolved };
    listeners.forEach((listener) => listener());
}

/**
 * @param persist  Only true when a person picked this. Resolving the device
 *                 preference must never be saved as though it were a choice.
 */
function adopt(mode, { persist }) {
    if (!allThemeModes.includes(mode)) return;

    currentMode = mode;

    if (persist) {
        try {
            window.localStorage.setItem(THEME_STORAGE_KEY, mode);
        } catch {
            /* the theme still applies for this visit */
        }
    }

    publish();
}

/** The saved preference wins over whatever is currently in memory. */
function resync() {
    const stored = readStoredMode();

    if (stored !== currentMode) {
        adopt(stored, { persist: false });
        return;
    }

    publish();
}

export function setThemeMode(mode) {
    if (!allThemeModes.includes(mode) || mode === currentMode) {
        if (mode === currentMode) paint();
        return;
    }

    adopt(mode, { persist: true });

    // Kept for anything outside React that wants to know.
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: mode }));
}

if (typeof window !== "undefined" && !window.__hkThemeStoreReady) {
    window.__hkThemeStoreReady = true;

    // Another tab saved a different preference.
    window.addEventListener("storage", (event) => {
        if (event.key && event.key !== THEME_STORAGE_KEY) return;
        resync();
    });

    // Someone called setThemeMode from outside React, or from another bundle.
    window.addEventListener(THEME_CHANGE_EVENT, (event) => {
        const next = event?.detail;
        if (allThemeModes.includes(next) && next !== currentMode) adopt(next, { persist: false });
    });

    // Restored from the back/forward cache, or brought back to the front, with
    // a stale document. Re-reading is cheap and cannot be wrong.
    window.addEventListener("pageshow", resync);
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) resync();
    });

    if (typeof window.matchMedia === "function") {
        // Re-reads the current mode instead of assuming "system": a listener
        // that outlives a change of mode must not force the device theme over
        // an explicit choice.
        window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
            if (currentMode === "system") publish();
        });
    }

    paint();
}

const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

const getSnapshot = () => snapshot;

export function useThemeMode() {
    const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    return { mode: state.mode, resolvedTheme: state.resolvedTheme, setMode: setThemeMode };
}

export default function ThemeToggle({ onClick, label = "Appearance", className = "" }) {
    const { mode, resolvedTheme, setMode } = useThemeMode();
    const Icon = customThemeModes.includes(mode)
        ? Palette
        : mode === "system" ? MonitorCog : resolvedTheme === "dark" ? Moon : Sun;

    const cycleTheme = () => {
        const currentIndex = themeModes.indexOf(mode);
        setMode(themeModes[(currentIndex + 1) % themeModes.length]);
    };

    return (
        <button
            type="button"
            onClick={onClick || cycleTheme}
            className={`theme-toggle ${className}`}
            aria-label={onClick ? "Open appearance settings" : "Change appearance"}
        >
            <span className="theme-toggle__button-icon">
                <Icon size={17} />
            </span>
            <span className="theme-toggle__label">{label}</span>
        </button>
    );
}
