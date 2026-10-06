import { Mic2, Volume2 } from "lucide-react";
import { useAssistant } from "../context/AssistantProvider";

export default function AssistantToggle({ className = "", hinted = false }) {
    const { enabled, speechSupported, toggleAssistant } = useAssistant();

    return (
        <div className={`flex flex-wrap items-center gap-2 ${className}`}>
            <button
                type="button"
                onClick={toggleAssistant}
                className={`group inline-flex min-h-9 items-center gap-2 rounded-xl border px-2 py-1.5 text-sm font-black transition hk-soft-hover sm:min-h-11 sm:gap-3 sm:rounded-2xl sm:px-3 sm:py-2 ${hinted ? "hk-start-measure-hint" : ""}`}
                style={{
                    backgroundColor: "var(--color-surface)",
                    borderColor: enabled ? "color-mix(in srgb, var(--color-success) 44%, var(--color-border))" : "var(--color-border)",
                    color: "var(--color-text)",
                }}
                aria-pressed={enabled}
                aria-label={`Turn Assistant Mode ${enabled ? "off" : "on"}`}
                title={speechSupported ? "Assistant Mode" : "Browser TTS unavailable"}
            >
                <span
                    className="relative inline-flex h-7 w-12 shrink-0 rounded-full p-1 transition"
                    style={{
                        backgroundColor: enabled ? "var(--color-success)" : "var(--color-border)",
                    }}
                >
                    <span
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-slate-700 shadow transition-transform"
                        style={{ transform: enabled ? "translateX(1.25rem)" : "translateX(0)" }}
                    >
                        {enabled ? <Volume2 size={12} /> : <Mic2 size={12} />}
                    </span>
                </span>
                <span className="hidden sm:inline">Assistant Mode</span>
            </button>
        </div>
    );
}
