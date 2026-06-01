import { useEffect, useState } from "react";
import { MonitorCog, Moon, Sun } from "lucide-react";

export const THEME_STORAGE_KEY = "health-kiosk-theme";
const THEME_CHANGE_EVENT = "health-kiosk-theme-change";
export const themeModes = ["system", "light", "dark"];

const getSystemTheme = () => {
    if (! window.matchMedia) return "light";

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const getStoredThemeMode = () => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    return themeModes.includes(storedTheme) ? storedTheme : "system";
};

const applyThemeMode = (mode) => {
    const resolvedTheme = mode === "system" ? getSystemTheme() : mode;

    document.documentElement.setAttribute("data-theme", resolvedTheme);
    document.documentElement.setAttribute("data-theme-mode", mode);
    localStorage.setItem(THEME_STORAGE_KEY, mode);

    return resolvedTheme;
};

export function useThemeMode() {
    const [mode, setModeState] = useState(getStoredThemeMode);
    const [resolvedTheme, setResolvedTheme] = useState(() => applyThemeMode(getStoredThemeMode()));

    useEffect(() => {
        const syncTheme = (event) => {
            const nextMode = event?.detail || getStoredThemeMode();
            if (themeModes.includes(nextMode)) setModeState(nextMode);
        };

        window.addEventListener(THEME_CHANGE_EVENT, syncTheme);
        window.addEventListener("storage", syncTheme);

        return () => {
            window.removeEventListener(THEME_CHANGE_EVENT, syncTheme);
            window.removeEventListener("storage", syncTheme);
        };
    }, []);

    useEffect(() => {
        setResolvedTheme(applyThemeMode(mode));

        if (mode !== "system" || ! window.matchMedia) {
            return undefined;
        }

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const syncSystemTheme = () => setResolvedTheme(applyThemeMode("system"));

        mediaQuery.addEventListener("change", syncSystemTheme);

        return () => mediaQuery.removeEventListener("change", syncSystemTheme);
    }, [mode]);

    const setMode = (nextMode) => {
        if (themeModes.includes(nextMode)) {
            setModeState(nextMode);
            window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: nextMode }));
        }
    };

    return { mode, resolvedTheme, setMode };
}

export default function ThemeToggle({ onClick, label = "Appearance", className = "" }) {
    const { mode, resolvedTheme, setMode } = useThemeMode();
    const Icon = mode === "system" ? MonitorCog : resolvedTheme === "dark" ? Moon : Sun;

    const cycleTheme = () => {
        const currentIndex = themeModes.indexOf(mode);
        const nextMode = themeModes[(currentIndex + 1) % themeModes.length];

        setMode(nextMode);
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
