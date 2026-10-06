import { ArrowRight } from "lucide-react";
import UserAvatar from "../../Users/components/UserAvatar";
import AlertActionsDropdown from "./AlertActionsDropdown";
import AlertSeverityBadge from "./AlertSeverityBadge";
import AlertStatusBadge from "./AlertStatusBadge";
import AlertTypeBadge from "./AlertTypeBadge";

export default function AlertTableRow({ alert, onView }) {
    const resolved = alert.status === "Resolved";
    const [firstname = "", ...rest] = String(alert.fullName || "").split(" ");

    // Cell padding, borders and hover all come from .hk-table now — repeating
    // them inline on every cell is what made this row so hard to read.
    return (
        <tr className="group">
            <td className="whitespace-nowrap">
                <span
                    className="rounded-lg px-2 py-1 text-[0.7rem] font-black tabular-nums"
                    style={{ backgroundColor: "var(--color-surface)", color: "var(--color-muted)" }}
                >
                    {alert.id}
                </span>
            </td>

            {/* Name, department and school ID collapsed into one identity cell,
                the same treatment the user tables use. */}
            <td className="whitespace-nowrap">
                <div className="flex items-center gap-3">
                    <UserAvatar firstname={firstname} lastname={rest.join(" ")} size={32} />
                    <div className="min-w-0">
                        <p className="truncate text-[0.8rem] font-black" style={{ color: "var(--color-text)" }}>
                            {alert.fullName}
                        </p>
                        <p className="truncate text-[0.7rem] font-semibold" style={{ color: "var(--color-muted)" }}>
                            {alert.schoolId}
                            {alert.department ? ` · ${alert.department}` : ""}
                        </p>
                    </div>
                </div>
            </td>

            <td className="whitespace-nowrap capitalize" style={{ color: "var(--color-muted)" }}>{alert.role}</td>

            <td className="whitespace-nowrap"><AlertTypeBadge type={alert.alertType} /></td>

            {/* The reading that tripped the alert, and what it became. The arrow
                only appears once there is a follow-up value to point at. */}
            <td className="whitespace-nowrap">
                <span className="font-black tabular-nums" style={{ color: "var(--color-text)" }}>
                    {alert.measurementValue}
                </span>
            </td>

            <td className="whitespace-nowrap">
                {resolved && alert.newMeasurement ? (
                    <span className="inline-flex items-center gap-1.5">
                        <ArrowRight size={13} style={{ color: "var(--color-muted)" }} />
                        <span className="font-black tabular-nums" style={{ color: "var(--color-success)" }}>
                            {alert.newMeasurement}
                        </span>
                    </span>
                ) : (
                    <span style={{ color: "var(--color-muted)" }}>—</span>
                )}
            </td>

            <td className="whitespace-nowrap"><AlertSeverityBadge severity={alert.severity} /></td>
            <td className="whitespace-nowrap"><AlertStatusBadge status={alert.status} /></td>

            <td className="whitespace-nowrap text-xs" style={{ color: "var(--color-muted)" }}>{alert.sessionStatus}</td>
            <td className="whitespace-nowrap text-xs" style={{ color: "var(--color-muted)" }}>{alert.triggeredAt}</td>
            <td className="whitespace-nowrap text-xs" style={{ color: "var(--color-muted)" }}>{alert.reviewedBy}</td>

            <td className="whitespace-nowrap">
                <div className="opacity-70 transition-opacity group-hover:opacity-100">
                    <AlertActionsDropdown onView={onView} />
                </div>
            </td>
        </tr>
    );
}
