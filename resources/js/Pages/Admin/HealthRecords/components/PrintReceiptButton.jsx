import { useState } from "react";
import { Printer } from "lucide-react";
import { printHealthReceipt } from "../../../Global/receiptPrinter";

export function toReceiptPayload(record) {
    return {
        id: record.id,
        name: record.fullName,
        school_id: record.schoolId,
        barcode: record.schoolId,
        role: record.role,
        date: record.recordedAt,
        heart_rate: record.heartRate,
        spo2: record.spo2,
        temperature: record.temperature,
        height: record.height,
        weight: record.weight,
        bmi: record.bmi,
        status: record.healthStatus,
        advice: record.advice,
    };
}

export default function PrintReceiptButton({ record, compact = false }) {
    const [printing, setPrinting] = useState(false);

    const handlePrint = async () => {
        if (printing) return;

        setPrinting(true);
        try {
            await printHealthReceipt(toReceiptPayload(record));
        } finally {
            setPrinting(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handlePrint}
            disabled={printing}
            className={compact
                ? "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.68rem] font-black text-white transition hk-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
                : "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black text-white transition hk-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
            }
            style={{ backgroundColor: "var(--color-primary)" }}
        >
            <Printer size={compact ? 13 : 16} />
            {printing ? "Printing..." : "Print receipt"}
        </button>
    );
}
