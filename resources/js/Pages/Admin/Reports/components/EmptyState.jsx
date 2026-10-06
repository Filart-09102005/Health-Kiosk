import { FileSearch, Sparkles } from "lucide-react";

export default function EmptyState({
    title = "No generated report yet",
    description = "Select the date and time range above, then click Generate report to display clinic report data.",
    className = "",
}) {
    return (
        <section
            className={`flex min-h-[22rem] flex-col items-center justify-center rounded-3xl border p-8 text-center shadow-2xl space-y-3 ${className}`}
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
            <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl border shadow-md transition-transform hover:scale-105"
                style={{
                    backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, var(--color-surface))",
                    borderColor: "color-mix(in srgb, var(--color-primary) 30%, transparent)",
                    color: "var(--color-primary)",
                }}
            >
                <FileSearch size={28} />
            </div>

            <h3 className="text-xl font-black flex items-center gap-2" style={{ color: "var(--color-text)" }}>
                {title}
                <Sparkles size={16} style={{ color: "var(--color-primary)" }} />
            </h3>

            <p className="max-w-md text-xs sm:text-sm font-semibold leading-6" style={{ color: "var(--color-muted)" }}>
                {description}
            </p>
        </section>
    );
}
