import { cardClassName, cardStyle } from "../utils/surface";

export default function MiniAnalyticsCard({ label, value, hint }) {
    return (
        <article className={`${cardClassName} p-3`} style={cardStyle}>
            <p className="text-[0.65rem] font-black uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>{label}</p>
            <p className="mt-1 text-lg font-black">{value}</p>
            {hint ? <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>{hint}</p> : null}
        </article>
    );
}
