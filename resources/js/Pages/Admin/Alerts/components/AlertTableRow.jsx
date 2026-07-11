import AlertActionsDropdown from "./AlertActionsDropdown";
import AlertSeverityBadge from "./AlertSeverityBadge";
import AlertStatusBadge from "./AlertStatusBadge";
import AlertTypeBadge from "./AlertTypeBadge";

export default function AlertTableRow({ alert, onView }) {
    return (
        <tr className="transition hover:bg-[color-mix(in_srgb,var(--color-text)_4%,transparent)]">
            <td className="border-b px-3 py-4 font-black whitespace-nowrap" style={{ borderColor: "var(--color-border)" }}>{alert.id}</td>
            <td className="border-b px-3 py-4 font-bold whitespace-nowrap" style={{ borderColor: "var(--color-border)" }}>{alert.schoolId}</td>
            <td className="border-b px-3 py-4 whitespace-nowrap" style={{ borderColor: "var(--color-border)" }}>
                <p className="font-black">{alert.fullName}</p>
                <p className="text-xs font-bold" style={{ color: "var(--color-muted)" }}>{alert.department}</p>
            </td>
            <td className="border-b px-3 py-4 capitalize font-bold whitespace-nowrap" style={{ borderColor: "var(--color-border)" }}>{alert.role}</td>
            <td className="border-b px-3 py-4 whitespace-nowrap" style={{ borderColor: "var(--color-border)" }}><AlertTypeBadge type={alert.alertType} /></td>
            <td className="border-b px-3 py-4 font-black whitespace-nowrap" style={{ borderColor: "var(--color-border)" }}>{alert.measurementValue}</td>
            <td className="border-b px-3 py-4 font-black whitespace-nowrap" style={{ borderColor: "var(--color-border)", color: alert.status === "Resolved" ? "var(--color-success)" : "inherit" }}>
                {alert.status === "Resolved" ? (alert.newMeasurement || "—") : "—"}
            </td>
            <td className="border-b px-3 py-4 whitespace-nowrap" style={{ borderColor: "var(--color-border)" }}><AlertSeverityBadge severity={alert.severity} /></td>
            <td className="border-b px-3 py-4 whitespace-nowrap" style={{ borderColor: "var(--color-border)" }}><AlertStatusBadge status={alert.status} /></td>
            <td className="border-b px-3 py-4 font-bold whitespace-nowrap" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>{alert.sessionStatus}</td>
            <td className="border-b px-3 py-4 font-bold whitespace-nowrap" style={{ borderColor: "var(--color-border)" }}>{alert.triggeredAt}</td>
            <td className="border-b px-3 py-4 font-bold whitespace-nowrap" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>{alert.reviewedBy}</td>
            <td className="border-b px-3 py-4 whitespace-nowrap" style={{ borderColor: "var(--color-border)" }}><AlertActionsDropdown onView={onView} /></td>
        </tr>
    );
}
