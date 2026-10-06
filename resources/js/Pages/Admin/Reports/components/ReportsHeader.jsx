import { FileText, Sparkles, ShieldCheck, Download, Calendar } from "lucide-react";

export default function ReportsHeader() {
    return (
        <section
            className="relative overflow-hidden rounded-3xl border p-6 sm:p-7 shadow-2xl transition-all"
            style={{
                backgroundColor: "var(--color-card)",
                borderColor: "var(--color-border)",
            }}
        >
            {/* Soft Ambient Background Glow */}
            <div
                className="absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl opacity-20 pointer-events-none"
                style={{ backgroundColor: "var(--color-primary)" }}
            />

            <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                    <div
                        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border shadow-lg transition-transform hover:scale-105"
                        style={{
                            backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, var(--color-surface))",
                            borderColor: "color-mix(in srgb, var(--color-primary) 30%, transparent)",
                            color: "var(--color-primary)",
                        }}
                    >
                        <FileText size={28} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span
                                className="rounded-md px-2.5 py-0.5 text-[0.68rem] font-black uppercase tracking-widest border"
                                style={{
                                    backgroundColor: "color-mix(in srgb, var(--color-primary) 14%, var(--color-surface))",
                                    borderColor: "color-mix(in srgb, var(--color-primary) 30%, transparent)",
                                    color: "var(--color-primary)",
                                }}
                            >
                                Admin Command Center
                            </span>
                            <span className="flex items-center gap-1 text-[11px] font-bold" style={{ color: "var(--color-muted)" }}>
                                <Sparkles size={13} style={{ color: "var(--color-primary)" }} />
                                Real-Time Reporting Engine
                            </span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tight sm:text-4xl" style={{ color: "var(--color-text)" }}>
                            Clinic Reports
                        </h1>
                        <p className="mt-1.5 max-w-2xl text-xs sm:text-sm font-bold leading-6" style={{ color: "var(--color-muted)" }}>
                            Generate, filter, and export comprehensive health check analytics, vital trends, and student health records into PDF or Excel formats.
                        </p>
                    </div>
                </div>

                {/* Quick Feature Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
                    <div
                        className="flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-black shadow-sm"
                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                    >
                        <ShieldCheck size={15} style={{ color: "var(--color-success)" }} />
                        <span>Verified Exports</span>
                    </div>
                    <div
                        className="flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-black shadow-sm"
                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                    >
                        <Download size={15} style={{ color: "var(--color-primary)" }} />
                        <span>PDF & Excel</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
