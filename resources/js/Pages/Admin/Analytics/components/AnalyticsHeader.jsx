import { BarChart3, ChevronRight } from "lucide-react";
import { cardClassName, cardStyle } from "../utils/surface";

export default function AnalyticsHeader() {
    return (
        <section className={`${cardClassName} p-5 sm:p-6`} style={cardStyle}>
            <nav className="flex flex-wrap items-center gap-1 text-xs font-bold" style={{ color: "var(--color-muted)" }}>
                <span>Admin</span><ChevronRight size={12} /><span style={{ color: "var(--color-primary)" }}>Data Analytics</span>
            </nav>
            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-content)" }}><BarChart3 size={22} /></span>
                    <div>
                        <h2 className="text-xl font-black sm:text-2xl">Data Analytics</h2>
                        <p className="mt-1 max-w-2xl text-sm leading-6" style={{ color: "var(--color-muted)" }}>
                            Monitor vitals trends, kiosk performance, session quality, and clinic health insights from kiosk telemetry.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
