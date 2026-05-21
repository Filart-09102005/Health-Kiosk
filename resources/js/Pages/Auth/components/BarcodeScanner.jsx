import { useEffect, useRef, useState } from "react";
import { ScanBarcode } from "lucide-react";

export default function BarcodeScanner({ value, status, message, onScan }) {
    const bufferRef = useRef("");
    const lastKeyTimeRef = useRef(0);
    const [isListening, setIsListening] = useState(true);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (! isListening) {
                return;
            }

            const now = Date.now();
            const isFastInput = now - lastKeyTimeRef.current < 80;

            if (event.key === "Enter") {
                const scanned = bufferRef.current.trim();

                if (scanned.length >= 4) {
                    onScan(scanned);
                }

                bufferRef.current = "";
                event.preventDefault();
                return;
            }

            if (event.key.length !== 1) {
                return;
            }

            bufferRef.current = isFastInput ? bufferRef.current + event.key : event.key;
            lastKeyTimeRef.current = now;
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isListening, onScan]);

    const statusColor = {
        success: "var(--color-success)",
        error: "var(--color-error)",
        warning: "#f59e0b",
        info: "var(--color-primary)",
    }[status || "info"];

    return (
        <div className="space-y-4">
            <div
                className="relative rounded-xl border px-5 py-6 text-center transition auth-panel"
                style={{
                    borderColor: status ? statusColor : "var(--auth-border)",
                }}
            >
                <div className="auth-fieldset-label">Barcode Scanner</div>
                <input
                    readOnly
                    value={value || ""}
                    placeholder={status === "info" ? "Scanning..." : "Scan your barcode"}
                    className="w-full bg-transparent text-center text-base font-semibold auth-strong-text outline-none"
                />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
                <p className="flex items-center gap-2 text-sm font-semibold auth-muted-text">
                    <ScanBarcode size={15} />
                    {message || "Ready for barcode input"}
                </p>
                <button
                    type="button"
                    onClick={() => setIsListening((current) => ! current)}
                    className="sr-only"
                    style={{
                        borderColor: "var(--auth-border)",
                        color: isListening ? "var(--color-success)" : "var(--auth-muted)",
                    }}
                >
                    {isListening ? "Scanner Active" : "Scanner Paused"}
                </button>
            </div>

            {value && status ? (
                <div
                    className="rounded-xl border px-4 py-3 text-sm font-semibold"
                    style={{
                        borderColor: statusColor,
                        color: statusColor,
                        backgroundColor: "color-mix(in srgb, currentColor, transparent 92%)",
                    }}
                >
                    Scanned barcode: <span className="font-bold">{value}</span>
                </div>
            ) : null}
        </div>
    );
}
