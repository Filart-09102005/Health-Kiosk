import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import HealthStatusBadge from "./HealthStatusBadge";
import MeasurementBadges from "./MeasurementBadges";
import RecordActionsDropdown from "./RecordActionsDropdown";
import SessionStatusBadge from "./SessionStatusBadge";
import { AnimatePresence, motion } from "framer-motion";

export default function RecordTableRow({ record, onViewDetails, isHistoryRow = false }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasHistory = !isHistoryRow && record.sessionHistory && record.sessionHistory.length > 0;

    return (
        <>
            <tr className={isHistoryRow ? "hk-row-child" : isExpanded ? "hk-row-parent-open" : ""}>
                <td className={`border-b px-3 py-3.5 ${isHistoryRow ? "pl-8" : ""}`} style={{ borderColor: "var(--color-border)" }}>
                    <div className="flex items-center gap-2">
                        {hasHistory && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="flex h-5 w-5 items-center justify-center rounded transition-colors"
                                style={{ backgroundColor: "color-mix(in srgb, var(--color-text) 6%, transparent)" }}
                                onMouseEnter={(event) => { event.currentTarget.style.backgroundColor = "color-mix(in srgb, var(--color-text) 12%, transparent)"; }}
                                onMouseLeave={(event) => { event.currentTarget.style.backgroundColor = "color-mix(in srgb, var(--color-text) 6%, transparent)"; }}
                            >
                                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                        )}
                        <span className="inline-flex items-center whitespace-nowrap font-black">{record.schoolId}</span>
                    </div>
                </td>
                <td className="border-b px-3 py-3.5" style={{ borderColor: "var(--color-border)" }}>
                    <p className="font-black">{record.fullName}</p>
                    <p className="text-xs font-semibold" style={{ color: "var(--color-muted)" }}>{record.department}</p>
                    {!isHistoryRow && record.recordCount > 1 ? (
                        <p className="mt-1 text-[0.68rem] font-black uppercase tracking-wide cursor-pointer select-none flex items-center gap-1 transition-opacity hover:opacity-75" onClick={() => setIsExpanded(!isExpanded)} style={{ color: "var(--color-primary)" }}>
                            {record.recordCount} records {isExpanded ? "(Hide)" : "(View All)"}
                        </p>
                    ) : null}
                </td>
                <td className="border-b px-3 py-3.5 text-xs font-bold" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>{record.role}</td>
                <td className="border-b px-3 py-3.5 font-semibold" style={{ borderColor: "var(--color-border)" }}>{record.temperature}°C</td>
                <td className="border-b px-3 py-3.5" style={{ borderColor: "var(--color-border)" }}>
                    <span className="inline-flex items-center whitespace-nowrap font-semibold">{record.heartRate} bpm</span>
                </td>
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
                    <MeasurementBadges completed={record.measurementsCompleted} total={record.measurementsTotal} missing={record.missingMeasurements} />
                </td>
                <td className="border-b px-3 py-3.5" style={{ borderColor: "var(--color-border)" }}>
                    <RecordActionsDropdown record={record} onViewDetails={onViewDetails} />
                </td>
            </tr>

            <AnimatePresence>
                {isExpanded && hasHistory && record.sessionHistory.map((historyRecord) => (
                    <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.16 }}
                        className="hk-row-child"
                        key={historyRecord.id}
                    >
                        <td className="border-b px-3 py-3.5 pl-8" style={{ borderColor: "var(--color-border)" }}>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center whitespace-nowrap font-black">{historyRecord.schoolId}</span>
                            </div>
                        </td>
                        <td className="border-b px-3 py-3.5" style={{ borderColor: "var(--color-border)" }}>
                            <p className="font-black">{historyRecord.fullName}</p>
                            <p className="text-xs font-semibold" style={{ color: "var(--color-muted)" }}>{historyRecord.department}</p>
                        </td>
                        <td className="border-b px-3 py-3.5 text-xs font-bold" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>{historyRecord.role}</td>
                        <td className="border-b px-3 py-3.5 font-semibold" style={{ borderColor: "var(--color-border)" }}>{historyRecord.temperature}°C</td>
                        <td className="border-b px-3 py-3.5" style={{ borderColor: "var(--color-border)" }}>
                            <span className="inline-flex items-center whitespace-nowrap font-semibold">{historyRecord.heartRate} bpm</span>
                        </td>
                        <td className="border-b px-3 py-3.5 font-semibold" style={{ borderColor: "var(--color-border)" }}>{historyRecord.spo2}%</td>
                        <td className="border-b px-3 py-3.5 font-semibold" style={{ borderColor: "var(--color-border)" }}>{historyRecord.height} cm</td>
                        <td className="border-b px-3 py-3.5 font-semibold" style={{ borderColor: "var(--color-border)" }}>{historyRecord.weight} kg</td>
                        <td className="border-b px-3 py-3.5 font-black" style={{ borderColor: "var(--color-border)" }}>{historyRecord.bmi}</td>
                        <td className="border-b px-3 py-3.5" style={{ borderColor: "var(--color-border)" }}>
                            <HealthStatusBadge status={historyRecord.healthStatus} />
                        </td>
                        <td className="border-b px-3 py-3.5" style={{ borderColor: "var(--color-border)" }}>
                            <SessionStatusBadge status={historyRecord.sessionStatus} />
                        </td>
                        <td className="border-b px-3 py-3.5" style={{ borderColor: "var(--color-border)" }}>
                            <p className="text-xs font-bold">{historyRecord.recordedAt}</p>
                            <MeasurementBadges completed={historyRecord.measurementsCompleted} total={historyRecord.measurementsTotal} missing={historyRecord.missingMeasurements} />
                        </td>
                        <td className="border-b px-3 py-3.5" style={{ borderColor: "var(--color-border)" }}>
                            <RecordActionsDropdown record={historyRecord} onViewDetails={onViewDetails} />
                        </td>
                    </motion.tr>
                ))}
            </AnimatePresence>
        </>
    );
}
