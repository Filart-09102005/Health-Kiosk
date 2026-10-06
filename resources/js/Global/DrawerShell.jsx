import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import useModalLayer from "./useModalLayer";

/**
 * @param {boolean} [loading]  Skeletonises the title and description while the
 *                             drawer's content loads, so the header settles at
 *                             the same moment as the body instead of standing
 *                             finished above a loading panel. The close button
 *                             stays live throughout — a drawer must always be
 *                             escapable, loaded or not.
 */
export default function DrawerShell({ open, onClose, title, description, children, footer, closeOnOverlay = true, closeLabel = "Close", loading = false, widePortrait = false }) {
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
                        className={`relative z-[9010] flex h-full w-full flex-col border-l shadow-2xl md:w-[50vw] ${widePortrait ? "hk-drawer-wide-portrait" : ""}`}
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
                            <div className="min-w-0 flex-1">
                                {loading ? (
                                    <div aria-busy="true" aria-label="Loading">
                                        {/* Sized to the real text so nothing shifts
                                            when the content arrives. */}
                                        <div
                                            className="h-7 w-52 max-w-full animate-pulse rounded-lg"
                                            style={{ backgroundColor: "color-mix(in srgb, var(--color-muted) 20%, transparent)" }}
                                        />
                                        {description ? (
                                            <div className="mt-3 space-y-2">
                                                <div
                                                    className="h-3 w-full max-w-sm animate-pulse rounded-full"
                                                    style={{ backgroundColor: "color-mix(in srgb, var(--color-muted) 14%, transparent)" }}
                                                />
                                                <div
                                                    className="h-3 w-2/3 max-w-[16rem] animate-pulse rounded-full"
                                                    style={{ backgroundColor: "color-mix(in srgb, var(--color-muted) 14%, transparent)" }}
                                                />
                                            </div>
                                        ) : null}
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="text-2xl font-black">{title}</h2>
                                        {description ? (
                                            <p className="mt-2 text-sm leading-6" style={{ color: "var(--color-muted)" }}>
                                                {description}
                                            </p>
                                        ) : null}
                                    </>
                                )}
                            </div>

                            {/* Skeletonised alongside the title, but still a real
                                button: the drawer has no Escape handler and may
                                disable overlay-click, so a placeholder that could
                                not be pressed would trap the person until the
                                request came back. */}
                            <button
                                type="button"
                                onClick={onClose}
                                className={`flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-black transition ${loading ? "animate-pulse" : "hk-soft-hover"}`}
                                style={{
                                    backgroundColor: loading
                                        ? "color-mix(in srgb, var(--color-muted) 16%, transparent)"
                                        : "var(--color-surface)",
                                    borderColor: loading ? "transparent" : "var(--color-border)",
                                    color: loading ? "transparent" : "inherit",
                                }}
                                aria-label={closeLabel}
                            >
                                <X size={18} style={loading ? { opacity: 0 } : undefined} aria-hidden={loading} />
                                <span className="hidden sm:inline">{closeLabel}</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</div>

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
