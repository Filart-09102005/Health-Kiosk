import { devicePerformance } from "../data/demoData";
import { cardClassName, cardStyle } from "../utils/surface";
import SectionHeader from "./SectionHeader";

function RadialProgress({ score }) {
    return (
        <div className="relative mx-auto h-20 w-20">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-surface)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeDasharray={`${score} 100`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-black">{score}%</span>
        </div>
    );
}

export default function DeviceMeasurementPanel() {
    return (
        <section className={`${cardClassName} p-5`} style={cardStyle}>
            <SectionHeader title="Device measurement performance" description="Sensor accuracy and stability indicators." />
            <div className="grid gap-4 sm:grid-cols-2">
                {devicePerformance.map((device) => (
                    <article key={device.name} className="rounded-2xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                        <RadialProgress score={device.score} />
                        <p className="mt-3 text-center text-sm font-black">{device.name}</p>
                        <p className="mt-1 text-center text-xs" style={{ color: "var(--color-muted)" }}>{device.caption}</p>
                    </article>
                ))}
            </div>
        </section>
    );
}
