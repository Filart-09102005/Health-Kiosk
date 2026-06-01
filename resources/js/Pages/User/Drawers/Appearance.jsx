import { useEffect, useState } from "react";
import { Check, MonitorCog, Moon, Sun } from "lucide-react";
import DrawerShell from "../../Global/DrawerShell";
import { useThemeMode } from "../../Global/ThemeToggle";

const themeOptions = [
    {
        key: "system",
        label: "System preference",
        description: "Follow the device theme.",
        icon: MonitorCog,
    },
    {
        key: "light",
        label: "Light",
        description: "Use the bright interface.",
        icon: Sun,
    },
    {
        key: "dark",
        label: "Dark",
        description: "Use the dark interface.",
        icon: Moon,
    },
];

function ThemePreview({ mode }) {
    const isDark = mode === "dark";
    const isSystem = mode === "system";
    const preview = isDark
        ? {
            page: "#000000",
            sidebar: "#050505",
            panel: "#0b0b0b",
            line: "#262626",
            text: "#f5f5f5",
            border: "#262626",
        }
        : {
            page: "#ffffff",
            sidebar: "#f8fafc",
            panel: "#ffffff",
            line: "#e2e8f0",
            text: "#0f172a",
            border: "#e2e8f0",
        };

    return (
        <div
            className="relative h-28 overflow-hidden rounded-2xl border"
            style={{
                backgroundColor: preview.page,
                borderColor: preview.border,
            }}
        >
            {isSystem ? (
                <div className="absolute inset-0 grid grid-cols-2">
                    <div style={{ backgroundColor: "#ffffff" }} />
                    <div style={{ backgroundColor: "#000000" }} />
                </div>
            ) : null}

            <div className="relative z-10 flex h-full">
                <div
                    className="w-1/3 border-r p-2"
                    style={{
                        backgroundColor: isSystem ? "rgba(248,250,252,0.86)" : preview.sidebar,
                        borderColor: preview.border,
                    }}
                >
                    <div className="h-2 w-8 rounded-full" style={{ backgroundColor: preview.text }} />
                    <div className="mt-3 space-y-2">
                        {[1, 2, 3].map((item) => (
                            <div
                                key={item}
                                className="h-2 rounded-full"
                                style={{ backgroundColor: preview.line }}
                            />
                        ))}
                    </div>
                </div>
                <div className="flex-1 p-3">
                    <div className="h-2 w-20 rounded-full" style={{ backgroundColor: preview.text }} />
                    <div
                        className="mt-4 h-12 rounded-xl border"
                        style={{
                            backgroundColor: isSystem ? "rgba(255,255,255,0.88)" : preview.panel,
                            borderColor: preview.border,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export default function Appearance({ open, onClose }) {
    const { mode, setMode } = useThemeMode();
    const [draftMode, setDraftMode] = useState(mode);

    useEffect(() => {
        if (open) setDraftMode(mode);
    }, [mode, open]);

    const save = () => {
        setMode(draftMode);
        onClose();
    };

    return (
        <DrawerShell
            open={open}
            onClose={onClose}
            title="Appearance"
            description="Change how Health Kiosk looks and feels on this device."
            footer={
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-2xl border px-4 py-3 text-sm font-black transition hk-soft-hover"
                        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={save}
                        className="rounded-2xl px-4 py-3 text-sm font-black text-white transition hk-primary-hover"
                        style={{ backgroundColor: "var(--color-primary)" }}
                    >
                        Apply appearance
                    </button>
                </div>
            }
        >
            <div>
                <p className="text-sm font-black">Interface theme</p>
                <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
                    Select or customize your UI theme.
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {themeOptions.map((option) => {
                        const Icon = option.icon;
                        const active = draftMode === option.key;

                        return (
                            <button
                                key={option.key}
                                type="button"
                                onClick={() => setDraftMode(option.key)}
                                className="rounded-2xl p-2 text-left transition hk-soft-hover"
                            >
                                <div
                                    className="relative rounded-[1.35rem] border p-2 transition"
                                    style={{
                                        borderColor: active ? "var(--color-primary)" : "var(--color-border)",
                                        boxShadow: active ? "0 18px 45px color-mix(in srgb, var(--color-primary) 20%, transparent)" : "none",
                                    }}
                                >
                                    <ThemePreview mode={option.key} />
                                    {active ? (
                                        <span
                                            className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full text-white shadow-lg"
                                            style={{ backgroundColor: "var(--color-primary)" }}
                                        >
                                            <Check size={16} />
                                        </span>
                                    ) : null}
                                </div>

                                <div className="mt-3 flex items-center gap-2">
                                    <Icon size={16} style={{ color: active ? "var(--color-primary)" : "var(--color-muted)" }} />
                                    <span className="text-sm font-black">{option.label}</span>
                                </div>
                                <p className="mt-1 text-xs leading-5" style={{ color: "var(--color-muted)" }}>
                                    {option.description}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </div>
        </DrawerShell>
    );
}
