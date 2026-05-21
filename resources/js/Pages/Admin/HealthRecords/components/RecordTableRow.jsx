import HealthStatusBadge from "./HealthStatusBadge";
import MeasurementBadges from "./MeasurementBadges";
import RecordActionsDropdown from "./RecordActionsDropdown";
import SessionStatusBadge from "./SessionStatusBadge";

export default function RecordTableRow({ record, onViewDetails }) {
    return (
        <tr className="transition hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,transparent)]">
            <td className="border-b px-3 py-3.5 font-black" style={{ borderColor: "var(--color-border)" }}>{record.schoolId}</td>
            <td className="border-b px-3 py-3.5" style={{ borderColor: "var(--color-border)" }}>
                <p className="font-black">{record.fullName}</p>
                <p className="text-xs font-semibold" style={{ color: "var(--color-muted)" }}>{record.department}</p>
            </td>
            <td className="border-b px-3 py-3.5 text-xs font-bold" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>{record.role}</td>
            <td className="border-b px-3 py-3.5 font-semibold" style={{ borderColor: "var(--color-border)" }}>{record.temperature}°C</td>
            <td className="border-b px-3 py-3.5 font-semibold" style={{ borderColor: "var(--color-border)" }}>{record.heartRate} bpm</td>
            <td className="border-b px-3 py-3.5 font-semibold" style={{ borderColor: "var(--color-border)" }}>{record.spo2}%</td>
            <td className="border-b px-3 py-3.5 font-semibold" style={{ borderColor: "var(--color-border)" }}>{record.height} cm</td>
            <td className="border-b px-3 py-3.5 font-semibold" style={{ borderColor: "var(--color-border)" }}>{record.weight} kg</td>
            <td className="border-b px-3 py-3.5 font-black" style={{ borderColor: "var(--color-border)" }}>{record.bmi}</td>
            <td className="border-b px-3 py-3.5" style={{ borderColor: "var(--color-border)" }}>
                <HealthStatusBadge status={record.healthStatus} />
            </td>
            <td className="border-b px-3 py-3.5" style={{ borderColor: "var(--color-border)" }}>
                <SessionStatusBadge status={record.sessionStatus} />
            </td>
            <td className="border-b px-3 py-3.5" style={{ borderColor: "var(--color-border)" }}>
                <p className="text-xs font-bold">{record.recordedAt}</p>
                <MeasurementBadges completed={record.measurementsCompleted} total={record.measurementsTotal} />
            </td>
            <td className="border-b px-3 py-3.5" style={{ borderColor: "var(--color-border)" }}>
                <RecordActionsDropdown record={record} onViewDetails={onViewDetails} />
            </td>
        </tr>
    );
}
