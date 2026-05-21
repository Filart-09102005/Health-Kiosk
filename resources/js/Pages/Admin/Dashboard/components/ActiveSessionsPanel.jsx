import { activeSessions } from "../data/demoData";
import { cardClassName, cardStyle } from "../utils/surface";
import ActiveSessionCard from "./ActiveSessionCard";
import SectionHeader from "./SectionHeader";

export default function ActiveSessionsPanel() {
    return (
        <article className={`${cardClassName} p-5`} style={cardStyle}>
            <SectionHeader
                title="Active kiosk session"
                description="Only one user can use the kiosk measurement flow at a time."
            />
            <div className="grid gap-3">
                {activeSessions.map((session) => (
                    <ActiveSessionCard key={session.id} session={session} />
                ))}
            </div>
        </article>
    );
}
