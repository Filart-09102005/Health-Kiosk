import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import useModalLayer from "./useModalLayer";

export default function DrawerShell({ open, onClose, title, description, children, footer, closeOnOverlay = true, closeLabel = "Close" }) {
    useModalLayer(open);

    const drawer = (
        <AnimatePresence>
            {open ? (
                <motion.div
                    className="fixed inset-0 z-[9000] flex justify-end bg-black/65 backdrop-blur-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <button
                        type="button"
                        aria-label="Close drawer"
                        onClick={closeOnOverlay ? onClose : undefined}
                        className="absolute inset-0 cursor-default"
                    />

                    <motion.aside
                        className="relative z-[9010] flex h-full w-full flex-col border-l shadow-2xl md:w-[50vw]"
                        style={{
                            backgroundColor: "var(--color-card)",
                            borderColor: "var(--color-border)",
                            color: "var(--color-text)",
                        }}
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    >
                        <div className="flex items-start justify-between gap-4 border-b p-6" style={{ borderColor: "var(--color-border)" }}>
                            <div>
                                <h2 className="text-2xl font-black">{title}</h2>
                                {description ? (
                                    <p className="mt-2 text-sm leading-6" style={{ color: "var(--color-muted)" }}>
                                        {description}
                                    </p>
                                ) : null}
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-black transition hk-soft-hover"
                                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                                aria-label={closeLabel}
                            >
                                <X size={18} />
                                <span className="hidden sm:inline">{closeLabel}</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">{children}</div>

                        {footer ? (
                            <div className="border-t p-5" style={{ borderColor: "var(--color-border)" }}>
                                {footer}
                            </div>
                        ) : null}
                    </motion.aside>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );

    return createPortal(drawer, document.body);
}
