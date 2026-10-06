import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const ToastContext = createContext(null);

const toastStyles = {
    success: {
        icon: CheckCircle2,
        color: "var(--color-success)",
        label: "Success",
    },
    error: {
        icon: AlertCircle,
        color: "var(--color-error)",
        label: "Error",
    },
    warning: {
        icon: TriangleAlert,
        color: "var(--color-primary)",
        label: "Warning",
    },
    info: {
        icon: Info,
        color: "var(--color-primary)",
        label: "Info",
    },
};

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback(
        ({ type = "info", title, message, duration = 4200 }) => {
            const id = crypto.randomUUID();

            setToasts((current) => [
                {
                    id,
                    type,
                    title: title || toastStyles[type]?.label || "Notice",
                    message,
                },
                ...current,
            ]);

            window.setTimeout(() => removeToast(id), duration);
        },
        [removeToast],
    );

    useEffect(() => {
        const handleToastEvent = (event) => {
            showToast(event.detail || {});
        };

        window.addEventListener("health-kiosk:toast", handleToastEvent);

        return () => window.removeEventListener("health-kiosk:toast", handleToastEvent);
    }, [showToast]);

    const value = useMemo(() => ({ showToast, removeToast }), [showToast, removeToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}

            {/* z-[9999] keeps toasts above the measurement overlay (z-50) and modals (z-[9500]) */}
            <div className="fixed right-4 top-4 z-[9999] w-[calc(100%-2rem)] max-w-sm pointer-events-none flex flex-col">
                {/* Scrollable stack — expands up to the bottom of the screen */}
                <div
                    className="flex flex-col gap-2 overflow-y-auto overflow-x-hidden pointer-events-auto pr-1 hk-no-scrollbar"
                    style={{ maxHeight: "calc(100vh - 2rem)", scrollbarWidth: "none", overflowAnchor: "none" }}
                >
                    <AnimatePresence initial={false}>
                        {toasts.map((toast) => {
                            const style = toastStyles[toast.type] || toastStyles.info;
                            const Icon = style.icon;

                            return (
                                <motion.div
                                    key={toast.id}
                                    layout
                                    initial={{ opacity: 0, x: 40, scale: 0.96 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9, height: 0, padding: 0, margin: 0, border: 0, overflow: "hidden" }}
                                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                                    className="shrink-0 rounded-xl border shadow-lg backdrop-blur"
                                    style={{
                                        backgroundColor: "var(--color-card)",
                                        borderColor: "var(--color-border)",
                                        color: "var(--color-text)",
                                        borderLeftWidth: "4px",
                                        borderLeftColor: style.color,
                                        padding: "10px 12px",
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="rounded-lg p-1.5 flex-shrink-0"
                                            style={{
                                                color: style.color,
                                                backgroundColor: "color-mix(in srgb, currentColor, transparent 85%)",
                                            }}
                                        >
                                            <Icon size={16} />
                                        </div>
                                        <div className="min-w-0 flex-1 text-left">
                                            <div className="text-sm font-semibold leading-tight">{toast.title}</div>
                                            {toast.message ? (
                                                <p className="mt-0.5 text-xs leading-4 break-words" style={{ color: "var(--color-muted)" }}>
                                                    {toast.message}
                                                </p>
                                            ) : null}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeToast(toast.id)}
                                            className="rounded-md p-1 transition flex-shrink-0 hover:opacity-70"
                                            style={{ color: "var(--color-muted)" }}
                                            aria-label="Close notification"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);

    if (! context) {
        throw new Error("useToast must be used inside ToastProvider.");
    }

    return context;
}
