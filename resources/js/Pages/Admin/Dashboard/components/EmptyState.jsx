import { Inbox } from "lucide-react";
import { cardClassName, cardStyle } from "../utils/surface";

export default function EmptyState({ title = "No data yet", message = "Records will appear here once kiosk activity is captured." }) {
    return (
        <div className={`flex flex-col items-center justify-center px-6 py-14 text-center ${cardClassName}`} style={cardStyle}>
            <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ backgroundColor: "var(--color-surface)", color: "var(--color-muted)" }}
            >
                <Inbox size={26} />
            </div>
            <p className="mt-4 text-base font-black">{title}</p>
            <p className="mt-2 max-w-sm text-sm" style={{ color: "var(--color-muted)" }}>
                {message}
            </p>
        </div>
    );
}
