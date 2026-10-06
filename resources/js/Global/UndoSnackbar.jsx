import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { RotateCcw, Trash2 } from "lucide-react";

// 6s: long enough to read the message and react, short enough that the real
// action does not feel indefinitely pending. Sits inside the 4–10s window
// interface guidelines recommend for an undoable action.
export const UNDO_WINDOW_MS = 6000;

/**
 * Bottom-centre snackbar offering to undo an action that has already been
 * applied optimistically.
 *
 * The caller is expected to delay the real (irreversible) work until
 * `onExpire` fires, so "undo" simply means never doing it — no resurrecting
 * a deleted record afterwards.
 */
export default function UndoSnackbar({ open, message, detail, onUndo, onExpire, duration = UNDO_WINDOW_MS }) {
    const [remaining, setRemaining] = useState(duration);

    useEffect(() => {
        if (!open) {
            setRemaining(duration);
            return undefined;
        }

        const startedAt = Date.now();
        const tick = window.setInterval(() => {
            const left = duration - (Date.now() - startedAt);
            setRemaining(left > 0 ? left : 0);
        }, 50);

        const expire = window.setTimeout(() => onExpire?.(), duration);

        return () => {
            window.clearInterval(tick);
            window.clearTimeout(expire);
        };
    }, [open, duration, onExpire]);

    const progress = Math.max(0, Math.min(1, remaining / duration));
    const secondsLeft = Math.ceil(remaining / 1000);

    const snackbar = (
        <AnimatePresence>
            {open ? (
                <motion.div
                    className="pointer-events-none fixed inset-x-0 bottom-6 z-[9600] flex justify-center px-4"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                    role="status"
                    aria-live="polite"
                >
                    <div
                        className="pointer-events-auto relative w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl"
                        style={{
                            backgroundColor: "var(--color-card)",
                            borderColor: "var(--color-border)",
                            color: "var(--color-text)",
                        }}
                    >
                        <div className="flex items-center gap-3 px-4 py-3.5">
                            <span
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                                style={{
                                    backgroundColor: "color-mix(in srgb, var(--color-error) 12%, transparent)",
                                    color: "var(--color-error)",
                                }}
                            >
                                <Trash2 size={16} />
                            </span>

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-black">{message}</p>
                                {detail ? (
                                    <p className="truncate text-xs font-semibold" style={{ color: "var(--color-muted)" }}>
                                        {detail}
                                    </p>
                                ) : null}
                            </div>

                            <button
                                type="button"
                                onClick={onUndo}
                                className="flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition hover:opacity-85 active:scale-95"
                                style={{
                                    backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, transparent)",
                                    color: "var(--color-primary)",
                                }}
                            >
                                <RotateCcw size={14} />
                                Undo
                                <span className="tabular-nums opacity-70">{secondsLeft}s</span>
                            </button>
                        </div>

                        {/* Draining bar — makes the remaining window visible
                            rather than something the user has to guess at. */}
                        <div className="h-1 w-full" style={{ backgroundColor: "var(--color-surface)" }}>
                            <div
                                className="h-full"
                                style={{
                                    width: `${progress * 100}%`,
                                    backgroundColor: "var(--color-primary)",
                                    transition: "width 50ms linear",
                                }}
                            />
                        </div>
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );

    return createPortal(snackbar, document.body);
}
