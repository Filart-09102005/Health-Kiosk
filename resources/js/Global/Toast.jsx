import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

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
                ...current,
                {
                    id,
                    type,
                    title: title || toastStyles[type]?.label || "Notice",
                    message,
                },
            ]);

            window.setTimeout(() => removeToast(id), duration);
        },
        [removeToast],
    );

    const value = useMemo(() => ({ showToast, removeToast }), [showToast, removeToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}

            <div className="fixed right-4 top-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
                {toasts.map((toast) => {
                    const style = toastStyles[toast.type] || toastStyles.info;
                    const Icon = style.icon;

                    return (
                        <div
                            key={toast.id}
                            className="animate-[toastIn_220ms_ease-out] rounded-2xl border p-4 shadow-2xl backdrop-blur"
                            style={{
                                backgroundColor: "var(--color-card)",
                                borderColor: "var(--color-border)",
                                color: "var(--color-text)",
                            }}
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className="mt-0.5 rounded-xl p-2"
                                    style={{
                                        color: style.color,
                                        backgroundColor: "color-mix(in srgb, currentColor, transparent 88%)",
                                    }}
                                >
                                    <Icon size={18} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm font-bold">{toast.title}</div>
                                    {toast.message ? (
                                        <p
                                            className="mt-1 text-sm leading-5"
                                            style={{ color: "var(--color-muted)" }}
                                        >
                                            {toast.message}
                                        </p>
                                    ) : null}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeToast(toast.id)}
                                    className="rounded-lg p-1 transition hk-soft-hover"
                                    style={{ color: "var(--color-muted)" }}
                                    aria-label="Close notification"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    );
                })}
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
