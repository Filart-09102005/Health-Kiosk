import { Printer } from "lucide-react";
import { printHealthReceipt } from "../../../Global/receiptPrinter";

export function toReceiptPayload(record) {
    return {
        name: record.fullName,
        barcode: record.schoolId,
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
    return (
        <button
            type="button"
            onClick={() => printHealthReceipt(toReceiptPayload(record))}
            className={compact
                ? "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.68rem] font-black text-white transition hk-primary-hover"
                : "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black text-white transition hk-primary-hover"
            }
            style={{ backgroundColor: "var(--color-primary)" }}
        >
            <Printer size={compact ? 13 : 16} />
            Print receipt
        </button>
    );
}
