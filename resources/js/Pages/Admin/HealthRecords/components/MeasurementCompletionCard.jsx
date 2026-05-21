import { recordsAnalytics } from "../data/demoData";
import { cardClassName, cardStyle } from "../utils/surface";

export default function MeasurementCompletionCard() {
    const percent = recordsAnalytics.measurementCompletion;

    return (
        <article className={`${cardClassName} p-4`} style={cardStyle}>
            <p className="text-sm font-black">Measurement completion</p>
            <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>Modules finished across all sessions</p>
            <div className="mt-5 flex items-end gap-2">
                <p className="text-4xl font-black">{percent}%</p>
                <p className="pb-1 text-xs font-bold" style={{ color: "var(--color-success)" }}>+3.2% this week</p>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-surface)" }}>
                <span className="block h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: "var(--color-primary)" }} />
            </div>
            <ul className="mt-4 space-y-2">
                {recordsAnalytics.incompleteMeasurements.map((item) => (
                    <li key={item.label} className="flex items-center justify-between text-xs font-bold">
                        <span style={{ color: "var(--color-muted)" }}>{item.label}</span>
                        <span className="font-black">{item.count} incomplete</span>
                    </li>
                ))}
            </ul>
        </article>
    );
}
