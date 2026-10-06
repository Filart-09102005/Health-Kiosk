import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import useModalLayer from "./useModalLayer";

/**
 * Centred modal chrome — the counterpart to DrawerShell, with the same
 * open/onClose/title/description/footer contract so the two are interchangeable
 * in a caller's head.
 *
 * Sits above DrawerShell's layer on purpose: modals are usually opened from
 * inside a drawer (Profile → Change Password), and at the same z-index the
 * drawer would cover them.
 */
export default function ModalShell({
    open,
    onClose,
    title,
    description,
    icon: Icon,
    children,
    footer,
    closeOnOverlay = true,
    closeLabel = "Close",
    maxWidth = "max-w-lg",
}) {
    useModalLayer(open);

    const bodyRef = useRef(null);
    const contentRef = useRef(null);
    // Which edges have content hidden beyond them, so the fades only show when
    // there is actually somewhere to scroll.
    const [edges, setEdges] = useState({ top: false, bottom: false });

    useEffect(() => {
        if (!open) return undefined;
        const onKeyDown = (event) => { if (event.key === "Escape") onClose?.(); };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    const syncEdges = useCallback(() => {
        const el = bodyRef.current;
        if (!el) return;
        const top = el.scrollTop > 4;
        const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 4;
        setEdges((current) => (current.top === top && current.bottom === bottom ? current : { top, bottom }));
    }, []);

    useEffect(() => {
        if (!open) return undefined;
        const el = bodyRef.current;
        if (!el) return undefined;

        syncEdges();
        el.addEventListener("scroll", syncEdges, { passive: true });

        // The body grows and shrinks as content appears (the password rules
        // guide, a validation message), so watch the content, not just the box.
        const observer = new ResizeObserver(syncEdges);
        observer.observe(el);
        if (contentRef.current) observer.observe(contentRef.current);

        return () => {
            el.removeEventListener("scroll", syncEdges);
            observer.disconnect();
        };
    }, [open, syncEdges]);

    const modal = (
        <AnimatePresence>
            {open ? (
                <motion.div
                    className="fixed inset-0 z-[9100] flex items-center justify-center bg-black/65 px-4 py-6 backdrop-blur-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <button
                        type="button"
                        aria-label={closeLabel}
                        onClick={closeOnOverlay ? onClose : undefined}
                        className="absolute inset-0 cursor-default"
                    />

                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        initial={{ opacity: 0, y: 18, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 18, scale: 0.96 }}
                        transition={{ duration: 0.18 }}
                        className={`relative z-[9110] flex max-h-full w-full ${maxWidth} flex-col overflow-hidden rounded-[2rem] border shadow-2xl`}
                        style={{
                            backgroundColor: "var(--color-card)",
                            borderColor: "var(--color-border)",
                            color: "var(--color-text)",
                        }}
                    >
                        <div
                            className="flex items-start justify-between gap-4 border-b p-6"
                            style={{ borderColor: "var(--color-border)" }}
                        >
                            <div className="flex items-start gap-3">
                                {Icon ? (
                                    <div
                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                                        style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-content)" }}
                                    >
                                        <Icon size={20} />
                                    </div>
                                ) : null}
                                <div>
                                    <h2 className="text-xl font-black">{title}</h2>
                                    {description ? (
                                        <p className="mt-1 text-xs leading-5" style={{ color: "var(--color-muted)" }}>
                                            {description}
                                        </p>
                                    ) : null}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                aria-label={closeLabel}
                                className="rounded-xl border p-2 transition hk-soft-hover"
                                style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* The flex item keeps its automatic minimum size (no
                            min-h-0), which is what lets the dialog grow to
                            max-h-full and the body scroll inside it.
                            The edge fades are sticky children rather than
                            absolute siblings so that layout stays untouched;
                            negative margins keep them out of the flow. */}
                        <div ref={bodyRef} className="hk-slim-scroll flex-1 overflow-y-auto">
                            <div
                                aria-hidden="true"
                                className="pointer-events-none sticky top-0 z-10 -mb-5 h-5 transition-opacity duration-200"
                                style={{
                                    opacity: edges.top ? 1 : 0,
                                    background: "linear-gradient(to bottom, var(--color-card), transparent)",
                                }}
                            />

                            <div ref={contentRef} className="px-6 py-6">{children}</div>

                            <div
                                aria-hidden="true"
                                className="pointer-events-none sticky bottom-0 z-10 -mt-7 h-7 transition-opacity duration-200"
                                style={{
                                    opacity: edges.bottom ? 1 : 0,
                                    background: "linear-gradient(to top, var(--color-card), transparent)",
                                }}
                            />
                        </div>

                        {footer ? (
                            <div className="border-t p-6" style={{ borderColor: "var(--color-border)" }}>
                                {footer}
                            </div>
                        ) : null}
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );

    return createPortal(modal, document.body);
}
