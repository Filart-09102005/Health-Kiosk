import { Radio, Server } from "lucide-react";
import { cardClassName, cardStyle } from "../utils/surface";
import MeasurementBadges from "./MeasurementBadges";
import SessionStatusBadge from "./SessionStatusBadge";

export default function SessionInformationCard({ record }) {
    return (
        <article className={`${cardClassName} p-4`} style={cardStyle}>
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black">Session information</p>
                <SessionStatusBadge status={record.sessionStatus} />
            </div>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-2">
                    <Server size={15} style={{ color: "var(--color-muted)" }} />
                    <span style={{ color: "var(--color-muted)" }}>Session ID:</span>
                    <span className="font-black">{record.sessionId}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Radio size={15} style={{ color: "var(--color-muted)" }} />
                    <span style={{ color: "var(--color-muted)" }}>Kiosk:</span>
                    <span className="font-black">{record.kiosk}</span>
                </div>
            </div>
            <div className="mt-4">
                <MeasurementBadges completed={record.measurementsCompleted} total={record.measurementsTotal} missing={record.missingMeasurements} />
            </div>
        </article>
    );
}
