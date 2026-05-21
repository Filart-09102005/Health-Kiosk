import { Activity } from "lucide-react";

export default function Loader({ label = "Loading", fullscreen = false }) {
    const content = (
        <div
            className="flex flex-col items-center justify-center gap-4 rounded-3xl border px-8 py-7 text-center shadow-2xl"
            style={{
                backgroundColor: "var(--color-card)",
                borderColor: "var(--color-border)",
                color: "var(--color-text)",
            }}
        >
            <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl hk-skeleton-shimmer"
                style={{ color: "var(--color-primary)" }}
            >
                <Activity size={24} />
            </div>
            <div>
                <div className="text-sm font-bold">{label}</div>
                <div className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>
                    Please wait a moment
                </div>
            </div>
        </div>
    );

    if (! fullscreen) {
        return <div className="flex min-h-[240px] items-center justify-center">{content}</div>;
    }

    return (
        <div
            className="fixed inset-0 z-40 flex items-center justify-center p-6 backdrop-blur-sm"
            style={{ backgroundColor: "color-mix(in srgb, var(--color-bg), transparent 18%)" }}
        >
            {content}
        </div>
    );
}
