import { Volume2, VolumeX } from "lucide-react";
import { useAssistant } from "../context/AssistantProvider";

export default function AssistantStatusBadge({ compact = false }) {
    const { enabled, speechSupported } = useAssistant();
    const Icon = enabled ? Volume2 : VolumeX;
    const label = enabled ? "Assistant ON" : "Assistant OFF";

    return (
        <span
            className="inline-flex min-h-9 items-center gap-2 rounded-2xl border px-3 text-xs font-black transition"
            style={{
                backgroundColor: enabled ? "color-mix(in srgb, var(--color-success) 12%, var(--color-surface))" : "var(--color-surface)",
                borderColor: enabled ? "color-mix(in srgb, var(--color-success) 34%, var(--color-border))" : "var(--color-border)",
                color: enabled ? "var(--color-success)" : "var(--color-muted)",
            }}
            title={speechSupported ? label : "Speech synthesis is not supported in this browser"}
        >
            <Icon size={15} />
            {compact ? null : label}
        </span>
    );
}
