import { cardClassName, cardStyle } from "../utils/surface";

export default function AnalyticsSummaryCard({ title, children }) {
    return (
        <article className={`${cardClassName} p-5`} style={cardStyle}>
            <p className="text-sm font-black">{title}</p>
            <div className="mt-4">{children}</div>
        </article>
    );
}
