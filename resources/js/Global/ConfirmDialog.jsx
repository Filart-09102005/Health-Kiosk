import { AnimatePresence, motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { createPortal } from "react-dom";
import useModalLayer from "./useModalLayer";

export default function ConfirmDialog({
    open,
    title = "Confirm action",
    message,
    confirmLabel = "Continue",
    cancelLabel = "No, stay",
    onConfirm,
    onCancel,
}) {
    useModalLayer(open);

    const dialog = (
        <AnimatePresence>
            {open ? (
                <motion.div
                    className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/65 px-4 backdrop-blur-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <button
                        type="button"
                        aria-label="Cancel"
                        onClick={onCancel}
                        className="absolute inset-0 cursor-default"
                    />

                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        initial={{ opacity: 0, y: 18, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 18, scale: 0.96 }}
                        transition={{ duration: 0.18 }}
                        className="relative z-[9010] w-full max-w-md rounded-[2rem] border p-6 text-center shadow-2xl"
                        style={{
                            backgroundColor: "var(--color-card)",
                            borderColor: "var(--color-border)",
                            color: "var(--color-text)",
                        }}
                    >
                        <div
                            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white"
                            style={{ backgroundColor: "var(--color-error)" }}
                        >
                            <LogOut size={24} />
                        </div>
                        <h2 className="mt-5 text-2xl font-black">{title}</h2>
                        <p className="mt-3 text-sm leading-6" style={{ color: "var(--color-muted)" }}>
                            {message}
                        </p>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="rounded-2xl border px-4 py-3 text-sm font-black transition hk-soft-hover"
                                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                            >
                                {cancelLabel}
                            </button>
                            <button
                                type="button"
                                onClick={onConfirm}
                                className="rounded-2xl px-4 py-3 text-sm font-black text-white transition hk-danger-solid-hover"
                                style={{ backgroundColor: "var(--color-error)" }}
                            >
                                {confirmLabel}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );

    return createPortal(dialog, document.body);
}
