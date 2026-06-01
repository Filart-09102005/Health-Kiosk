import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, FileDown, MoreHorizontal, Printer, Radio } from "lucide-react";
import { printHealthReceipt } from "../../../Global/receiptPrinter";
import { toReceiptPayload } from "./PrintReceiptButton";

export default function RecordActionsDropdown({ record, onViewDetails, onViewSession }) {
    const [open, setOpen] = useState(false);

    const actions = [
        { label: "View details", icon: Eye, onClick: () => onViewDetails(record) },
        { label: "View session", icon: Radio, onClick: () => onViewSession(record) },
        { label: "Print receipt", icon: Printer, onClick: () => printHealthReceipt(toReceiptPayload(record)) },
        { label: "Export record", icon: FileDown, onClick: () => setOpen(false) },
    ];

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((current) => ! current)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border transition hk-soft-hover"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                aria-label="Record actions"
            >
                <MoreHorizontal size={16} />
            </button>
            <AnimatePresence>
                {open ? (
                    <>
                        <button type="button" className="fixed inset-0 z-30 cursor-default" aria-label="Close menu" onClick={() => setOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                            className="absolute right-0 top-11 z-40 w-48 overflow-hidden rounded-xl border p-1 shadow-2xl backdrop-blur-xl"
                            style={{
                                backgroundColor: "color-mix(in srgb, var(--color-card) 96%, transparent)",
                                borderColor: "var(--color-border)",
                            }}
                        >
                            {actions.map((action) => {
                                const Icon = action.icon;

                                return (
                                    <button
                                        key={action.label}
                                        type="button"
                                        onClick={() => {
                                            action.onClick();
                                            setOpen(false);
                                        }}
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-black transition hk-soft-hover"
                                    >
                                        <Icon size={14} />
                                        {action.label}
                                    </button>
                                );
                            })}
                        </motion.div>
                    </>
                ) : null}
            </AnimatePresence>
        </div>
    );
}
