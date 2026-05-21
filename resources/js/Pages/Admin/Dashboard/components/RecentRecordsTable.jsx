import { Printer } from "lucide-react";
import { printHealthReceipt } from "../../../Global/receiptPrinter";

const statusColor = (status) => {
    if (status === "Normal") return "var(--color-success)";
    if (status === "Alert") return "var(--color-error)";
    if (status === "Watch") return "var(--color-primary)";

    return "var(--color-gray)";
};

export default function RecentRecordsTable({ records = [] }) {
    return (
        <section className="mt-5 rounded-[14px] border p-5 shadow-xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-black">Recent health records</h2>
                    <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
                        Admin can print any user record from this table.
                    </p>
                </div>
            </div>

            <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                    <thead>
                        <tr style={{ color: "var(--color-muted)" }}>
                            {["User", "Barcode", "Vitals", "BMI", "Status", "Action"].map((heading) => (
                                <th key={heading} className="border-b px-3 py-3 font-black" style={{ borderColor: "var(--color-border)" }}>
                                    {heading}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((record) => (
                            <tr key={record.id}>
                                <td className="border-b px-3 py-4 font-black" style={{ borderColor: "var(--color-border)" }}>{record.name}</td>
                                <td className="border-b px-3 py-4" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>{record.barcode}</td>
                                <td className="border-b px-3 py-4" style={{ borderColor: "var(--color-border)" }}>
                                    {record.heart_rate} bpm - {record.spo2}% - {record.temperature} C
                                </td>
                                <td className="border-b px-3 py-4 font-black" style={{ borderColor: "var(--color-border)" }}>{record.bmi}</td>
                                <td className="border-b px-3 py-4" style={{ borderColor: "var(--color-border)" }}>
                                    <span
                                        className="rounded-full px-3 py-1 text-xs font-black"
                                        style={{
                                            color: statusColor(record.status),
                                            backgroundColor: "color-mix(in srgb, currentColor 10%, transparent)",
                                        }}
                                    >
                                        {record.status}
                                    </span>
                                </td>
                                <td className="border-b px-3 py-4" style={{ borderColor: "var(--color-border)" }}>
                                    <button
                                        type="button"
                                        onClick={() => printHealthReceipt(record)}
                                        className="flex items-center gap-2 rounded-[12px] px-3 py-2 text-xs font-black text-white transition hk-primary-hover"
                                        style={{ backgroundColor: "var(--color-primary)" }}
                                    >
                                        <Printer size={15} />
                                        Print
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
