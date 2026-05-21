import { useCallback, useEffect, useRef, useState } from "react";
import { ScanBarcode } from "lucide-react";

export default function BarcodeLoginForm({ errors, loading, onSubmit }) {
    const [barcode, setBarcode] = useState("");
    const bufferRef = useRef("");
    const lastKeyTimeRef = useRef(0);

    const submitBarcode = useCallback(
        (value = barcode) => {
            const scannedBarcode = value.trim();

            if (! scannedBarcode || loading) {
                return;
            }

            onSubmit(scannedBarcode);
        },
        [barcode, loading, onSubmit],
    );

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (loading) {
                return;
            }

            const now = Date.now();
            const isFastInput = now - lastKeyTimeRef.current < 80;

            if (event.key === "Enter") {
                const scanned = bufferRef.current.trim();

                if (scanned.length >= 4) {
                    setBarcode(scanned);
                    submitBarcode(scanned);
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
    }, [loading, submitBarcode]);

    return (
        <div className="mt-6 space-y-4">
            <div
                className="relative rounded-xl border px-5 py-6 text-center auth-panel"
                style={{ borderColor: errors.barcode ? "var(--color-error)" : undefined }}
            >
                <div className="auth-fieldset-label">Barcode Scanner</div>
                <input
                    readOnly
                    value={barcode}
                    placeholder={loading ? "Checking..." : "Scan your barcode"}
                    className="w-full bg-transparent text-center text-base font-semibold auth-strong-text outline-none"
                    autoComplete="off"
                />
            </div>

            {errors.barcode ? (
                <p className="text-sm" style={{ color: "var(--color-error)" }}>
                    {errors.barcode[0]}
                </p>
            ) : null}

            <div className="flex items-center justify-center gap-2 text-sm font-semibold auth-muted-text">
                <ScanBarcode size={15} />
                Ready for barcode input
            </div>
        </div>
    );
}
