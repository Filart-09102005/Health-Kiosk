import { useEffect, useRef, useState } from "react";
import { Check, MonitorCog, Moon, Sun, Heart, Citrus, Coffee, Waves, Gem, Cake, Radio, Flower2, Ghost, Disc3, Crown, Leaf, Anchor } from "lucide-react";
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
    {
        key: "valentine",
        label: "Valentine",
        description: "Soft pink with a rose accent.",
        icon: Heart,
    },
    {
        key: "lemonade",
        label: "Lemonade",
        description: "Bright and citrusy, green accent.",
        icon: Citrus,
    },
    {
        key: "caramellatte",
        label: "Caramellatte",
        description: "Warm cream tones with a dark accent.",
        icon: Coffee,
    },
    {
        key: "aqua",
        label: "Aqua",
        description: "Deep teal with a bright cyan accent.",
        icon: Waves,
    },
    {
        key: "emerald",
        label: "Emerald",
        description: "Crisp white with a green accent.",
        icon: Gem,
    },
    {
        key: "cupcake",
        label: "Cupcake",
        description: "Soft pastel with a teal accent.",
        icon: Cake,
    },
    {
        key: "retro",
        label: "Retro",
        description: "Warm vintage tones with a coral accent.",
        icon: Radio,
    },
    {
        key: "garden",
        label: "Garden",
        description: "Muted neutrals with a hot pink accent.",
        icon: Flower2,
    },
    {
        key: "halloween",
        label: "Halloween",
        description: "Near-black with a pumpkin-orange accent.",
        icon: Ghost,
    },
    {
        key: "lofi",
        label: "Lo-fi",
        description: "Grayscale, minimal and understated.",
        icon: Disc3,
    },
    {
        key: "luxury",
        label: "Luxury",
        description: "Near-black with a gold-toned accent.",
        icon: Crown,
    },
    {
        key: "autumn",
        label: "Autumn",
        description: "Warm neutrals with a deep red accent.",
        icon: Leaf,
    },
    {
        key: "abyss",
        label: "Abyss",
        description: "Deep blue-black with a bright lime accent.",
        icon: Anchor,
    },
];

// Same source tokens as the matching [data-theme="..."] blocks in app.css —
// duplicated here (as the light/dark previews already were) because every
// option's swatch has to render at once, while only one theme is ever
// actually applied to <html>.
const CUSTOM_THEME_PREVIEWS = {
    valentine: {
        page: "oklch(97% 0.014 343.198)",
        sidebar: "oklch(94% 0.028 342.258)",
        panel: "oklch(97% 0.014 343.198)",
        line: "oklch(89% 0.061 343.231)",
        text: "oklch(52% 0.223 3.958)",
        border: "oklch(89% 0.061 343.231)",
    },
    lemonade: {
        page: "oklch(98.71% 0.02 123.72)",
        sidebar: "oklch(91.8% 0.018 123.72)",
        panel: "oklch(98.71% 0.02 123.72)",
        line: "oklch(84.89% 0.017 123.72)",
        text: "oklch(19.742% 0.004 123.72)",
        border: "oklch(84.89% 0.017 123.72)",
    },
    caramellatte: {
        page: "oklch(98% 0.016 73.684)",
        sidebar: "oklch(95% 0.038 75.164)",
        panel: "oklch(98% 0.016 73.684)",
        line: "oklch(90% 0.076 70.697)",
        text: "oklch(40% 0.123 38.172)",
        border: "oklch(90% 0.076 70.697)",
    },
    aqua: {
        page: "oklch(37% 0.146 265.522)",
        sidebar: "oklch(28% 0.091 267.935)",
        panel: "oklch(37% 0.146 265.522)",
        line: "oklch(22% 0.091 267.935)",
        text: "oklch(90% 0.058 230.902)",
        border: "oklch(22% 0.091 267.935)",
    },
    emerald: {
        page: "oklch(100% 0 0)",
        sidebar: "oklch(93% 0 0)",
        panel: "oklch(100% 0 0)",
        line: "oklch(86% 0 0)",
        text: "oklch(35.519% 0.032 262.988)",
        border: "oklch(86% 0 0)",
    },
    cupcake: {
        page: "oklch(97.788% 0.004 56.375)",
        sidebar: "oklch(93.982% 0.007 61.449)",
        panel: "oklch(97.788% 0.004 56.375)",
        line: "oklch(91.586% 0.006 53.44)",
        text: "oklch(23.574% 0.066 313.189)",
        border: "oklch(91.586% 0.006 53.44)",
    },
    retro: {
        page: "oklch(91.637% 0.034 90.515)",
        sidebar: "oklch(88.272% 0.049 91.774)",
        panel: "oklch(91.637% 0.034 90.515)",
        line: "oklch(84.133% 0.065 90.856)",
        text: "oklch(41% 0.112 45.904)",
        border: "oklch(84.133% 0.065 90.856)",
    },
    garden: {
        page: "oklch(92.951% 0.002 17.197)",
        sidebar: "oklch(86.445% 0.002 17.197)",
        panel: "oklch(92.951% 0.002 17.197)",
        line: "oklch(79.938% 0.001 17.197)",
        text: "oklch(16.961% 0.001 17.32)",
        border: "oklch(79.938% 0.001 17.197)",
    },
    halloween: {
        page: "oklch(21% 0.006 56.043)",
        sidebar: "oklch(14% 0.004 49.25)",
        panel: "oklch(21% 0.006 56.043)",
        line: "oklch(0% 0 0)",
        text: "oklch(84.955% 0 0)",
        border: "oklch(0% 0 0)",
    },
    lofi: {
        page: "oklch(100% 0 0)",
        sidebar: "oklch(97% 0 0)",
        panel: "oklch(100% 0 0)",
        line: "oklch(94% 0 0)",
        text: "oklch(0% 0 0)",
        border: "oklch(94% 0 0)",
    },
    luxury: {
        page: "oklch(14.076% 0.004 285.822)",
        sidebar: "oklch(20.219% 0.004 308.229)",
        panel: "oklch(14.076% 0.004 285.822)",
        line: "oklch(23.219% 0.004 308.229)",
        text: "oklch(75.687% 0.123 76.89)",
        border: "oklch(23.219% 0.004 308.229)",
    },
    autumn: {
        page: "oklch(95.814% 0 0)",
        sidebar: "oklch(89.107% 0 0)",
        panel: "oklch(95.814% 0 0)",
        line: "oklch(82.4% 0 0)",
        text: "oklch(19.162% 0 0)",
        border: "oklch(82.4% 0 0)",
    },
    abyss: {
        page: "oklch(20% 0.08 209)",
        sidebar: "oklch(15% 0.08 209)",
        panel: "oklch(20% 0.08 209)",
        line: "oklch(10% 0.08 209)",
        text: "oklch(90% 0.076 70.697)",
        border: "oklch(10% 0.08 209)",
    },
};

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
        : isSystem || mode === "light"
            ? {
                page: "#ffffff",
                sidebar: "#f8fafc",
                panel: "#ffffff",
                line: "#e2e8f0",
                text: "#0f172a",
                border: "#e2e8f0",
            }
            : CUSTOM_THEME_PREVIEWS[mode];

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
    const activeOptionRef = useRef(null);

    useEffect(() => {
        if (open) setDraftMode(mode);
    }, [mode, open]);

    // With 16 themes the active one can be well below the fold - land on it
    // instead of making someone scroll to find what's already selected.
    // Delayed past the drawer's own entrance transition, so this scroll
    // isn't fighting that animation for the same frame.
    useEffect(() => {
        if (!open) return undefined;

        const timer = window.setTimeout(() => {
            activeOptionRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
            activeOptionRef.current?.focus({ preventScroll: true });
        }, 320);

        return () => window.clearTimeout(timer);
    }, [open]);

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
                        className="rounded-2xl px-4 py-3 text-sm font-black transition hk-primary-hover"
                        style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-content)" }}
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
                                ref={active ? activeOptionRef : undefined}
                                type="button"
                                onClick={() => setDraftMode(option.key)}
                                className="rounded-2xl p-2 text-left transition hk-soft-hover outline-none focus-visible:ring-2"
                                style={{ "--tw-ring-color": "var(--color-primary)" }}
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
                                            className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full shadow-lg"
                                            style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-content)" }}
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
