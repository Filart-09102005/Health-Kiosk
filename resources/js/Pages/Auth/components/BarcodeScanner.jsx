import { useEffect, useRef, useState } from "react";
import { ScanBarcode } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function BarcodeScanner({ value, status, message, onScan }) {
    const containerRef = useRef(null);
    const [size, setSize] = useState({ width: 0, height: 0 });
    const bufferRef = useRef("");
    const lastKeyTimeRef = useRef(0);
    const [isListening, setIsListening] = useState(true);

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setSize({
                    width: entry.target.offsetWidth,
                    height: entry.target.offsetHeight
                });
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

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

    // Status mapping: default to null if no specific status
    const isError = status === "error" || status === "warning";
    const isSuccess = status === "success";
    const hasAnimation = isSuccess || isError;

    // Use #38BDF8 for success, var(--color-error) for error
    const activeColor = isSuccess ? "#38BDF8" : isError ? "var(--color-error)" : "var(--auth-border)";

    const { width: w, height: h } = size;
    const r = 12; // 12px for rounded-xl
    const p = 2; // padding for stroke width

    const rightPath = w > 0 ? `M ${w/2} ${p} L ${w - r} ${p} Q ${w - p} ${p} ${w - p} ${r + p} L ${w - p} ${h - r} Q ${w - p} ${h - p} ${w - r} ${h - p} L ${r} ${h - p} Q ${p} ${h - p} ${p} ${h - r} L ${p} ${r + p} Q ${p} ${p} ${r} ${p} L ${w/2} ${p}` : "";
    const leftPath = w > 0 ? `M ${w/2} ${p} L ${r} ${p} Q ${p} ${p} ${p} ${r + p} L ${p} ${h - r} Q ${p} ${h - p} ${r} ${h - p} L ${w - r} ${h - p} Q ${w - p} ${h - p} ${w - p} ${h - r} L ${w - p} ${r + p} Q ${w - p} ${p} ${w - r} ${p} L ${w/2} ${p}` : "";

    return (
        <div className="space-y-5">
            <motion.div
                ref={containerRef}
                className="group relative rounded-xl border p-8 text-center transition-all duration-500 overflow-hidden auth-panel"
                animate={{ scale: 1 }}
                style={{
                    backgroundColor: hasAnimation ? `color-mix(in srgb, ${activeColor}, transparent 92%)` : "var(--auth-panel)",
                    borderColor: hasAnimation ? activeColor : "var(--auth-border)",
                    boxShadow: hasAnimation
                        ? `0 12px 40px color-mix(in srgb, ${activeColor}, transparent 75%), 0 0 20px color-mix(in srgb, ${activeColor}, transparent 85%)`
                        : "none",
                }}
            >
                {/* ── Premium Dual Energy Pulse Border Animation ── */}
                <AnimatePresence>
                    {hasAnimation && w > 0 && (
                        <svg
                            className="absolute inset-0 h-full w-full pointer-events-none z-20 overflow-visible"
                            width={w}
                            height={h}
                        >
                            <motion.path
                                d={rightPath}
                                fill="none"
                                stroke={activeColor}
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ filter: `drop-shadow(0 0 8px ${activeColor}) drop-shadow(0 0 16px color-mix(in srgb, ${activeColor}, transparent 40%))` }}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                exit={{ opacity: 0, transition: { duration: 0.3 } }}
                                transition={{ duration: 2.5, ease: "easeInOut" }}
                            />
                            <motion.path
                                d={leftPath}
                                fill="none"
                                stroke={activeColor}
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ filter: `drop-shadow(0 0 8px ${activeColor}) drop-shadow(0 0 16px color-mix(in srgb, ${activeColor}, transparent 40%))` }}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                exit={{ opacity: 0, transition: { duration: 0.3 } }}
                                transition={{ duration: 2.5, ease: "easeInOut" }}
                            />
                        </svg>
                    )}
                </AnimatePresence>

                <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[1rem]" 
                         style={{ 
                             backgroundColor: "color-mix(in srgb, #38BDF8, transparent 84%)",
                             color: "#38BDF8",
                             boxShadow: "0 0 24px rgba(56, 189, 248, 0.35)"
                         }}>
                        <ScanBarcode size={32} />
                    </div>
                    
                    <div className="mt-2 text-sm font-black tracking-widest text-transparent bg-clip-text uppercase"
                         style={{ backgroundImage: "linear-gradient(to right, #38BDF8, #60a5fa)" }}>
                        Barcode Scanner
                    </div>
                    
                    <input
                        readOnly
                        value={value || ""}
                        placeholder={status === "info" ? "Scanning..." : "Ready to scan ID"}
                        className="w-full bg-transparent text-center text-xl font-bold outline-none"
                        style={{ color: "var(--auth-text)" }}
                    />
                </div>
            </motion.div>

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

            {value && status && status !== "info" ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border px-5 py-4 text-center text-sm font-semibold"
                    style={{
                        borderColor: activeColor,
                        color: activeColor,
                        backgroundColor: `color-mix(in srgb, ${activeColor}, transparent 92%)`,
                    }}
                >
                    Scanned barcode: <span className="font-bold tracking-widest">{value}</span>
                </motion.div>
            ) : null}
        </div>
    );
}
