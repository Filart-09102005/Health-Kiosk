import ExportStatusBadge from "./ExportStatusBadge";

export default function ExportHistoryCard({ item }) {
    return (
        <tr className="transition hover:bg-[color-mix(in_srgb,var(--color-text)_4%,transparent)]">
            <td className="border-b px-3 py-3 font-black" style={{ borderColor: "var(--color-border)" }}>{item.id}</td>
            <td className="border-b px-3 py-3 font-bold" style={{ borderColor: "var(--color-border)" }}>{item.file}</td>
            <td className="border-b px-3 py-3 font-black" style={{ borderColor: "var(--color-border)" }}>{item.format}</td>
            <td className="border-b px-3 py-3 font-bold" style={{ borderColor: "var(--color-border)" }}>{item.by}</td>
            <td className="border-b px-3 py-3 font-bold" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>{item.time}</td>
            <td className="border-b px-3 py-3" style={{ borderColor: "var(--color-border)" }}><ExportStatusBadge status={item.status} /></td>
        </tr>
    );
}
