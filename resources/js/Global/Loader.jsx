import { LoaderCircle, ShieldCheck } from "lucide-react";

export default function Loader({ label = "Loading", message = "Preparing your workspace", fullscreen = false }) {
    const content = (
        <div
            className="flex w-[min(90vw,23rem)] flex-col items-center justify-center gap-5 rounded-3xl border px-8 py-8 text-center shadow-2xl"
            style={{
                backgroundColor: "color-mix(in srgb, var(--color-card) 92%, transparent)",
                borderColor: "color-mix(in srgb, var(--color-primary) 18%, var(--color-border))",
                color: "var(--color-text)",
                boxShadow: "0 28px 80px color-mix(in srgb, var(--color-primary) 18%, transparent)",
            }}
        >
            <div className="relative flex h-16 w-16 items-center justify-center">
                <LoaderCircle
                    className="absolute animate-spin"
                    size={64}
                    strokeWidth={1.8}
                    style={{ color: "color-mix(in srgb, var(--color-primary) 62%, transparent)" }}
                />
                <div
                    className="flex h-11 w-11 items-center justify-center rounded-2xl"
                    style={{
                        backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, var(--color-card))",
                        color: "var(--color-primary)",
                    }}
                >
                    <ShieldCheck size={22} />
                </div>
            </div>
            <div>
                <div className="text-base font-black tracking-tight">{label}</div>
                <div className="mt-2 text-sm font-semibold leading-6" style={{ color: "var(--color-muted)" }}>
                    {message}
                </div>
            </div>
        </div>
    );

    if (! fullscreen) {
        return <div className="flex min-h-[240px] items-center justify-center">{content}</div>;
    }

    return (
        <div
            className="fixed inset-0 z-40 flex items-center justify-center p-6 backdrop-blur-md"
            style={{ backgroundColor: "color-mix(in srgb, var(--color-bg), transparent 12%)" }}
        >
            {content}
        </div>
    );
}
