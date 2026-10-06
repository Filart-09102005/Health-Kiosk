import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, Clock } from "lucide-react";
import usePopoverPlacement from "./usePopoverPlacement";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

// ── "HH:mm" (24h, matching <input type="time">) ⇄ display parts ──────────
const parse = (value) => {
    const [h, m] = String(value || "").split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return { hour24: h, minute: m };
};
const toValue = ({ hour24, minute }) => `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
const to12 = (hour24) => ({ hour: hour24 % 12 === 0 ? 12 : hour24 % 12, meridiem: hour24 < 12 ? "AM" : "PM" });
const to24 = (hour, meridiem) => (meridiem === "AM" ? (hour === 12 ? 0 : hour) : hour === 12 ? 12 : hour + 12);

const label = (value) => {
    const parsed = parse(value);
    if (!parsed) return "--:--";
    const { hour, meridiem } = to12(parsed.hour24);
    return `${hour}:${String(parsed.minute).padStart(2, "0")} ${meridiem}`;
};

const PRESETS = [
    { key: "all", label: "All day", range: { from: "00:00", to: "23:59" } },
    { key: "clinic", label: "Clinic hours", range: { from: "07:00", to: "17:00" } },
    { key: "morning", label: "Morning", range: { from: "06:00", to: "12:00" } },
    { key: "afternoon", label: "Afternoon", range: { from: "12:00", to: "18:00" } },
    { key: "evening", label: "Evening", range: { from: "18:00", to: "23:59" } },
];

/**
 * Time-of-day range picker, built to sit beside DateRangePicker.
 *
 * Same contract as the date one: the choice is held as a draft until Apply, so
 * a half-set range never reaches the caller, and presets stage rather than
 * commit so they can be seen and adjusted first.
 *
 * @param from  "HH:mm" 24-hour
 * @param to    "HH:mm" 24-hour
 * @param onApply ({ from, to })
 */
export default function TimeRangePicker({ from, to, onApply, label: fieldLabel = "Time of day", align = "left" }) {
    const [open, setOpen] = useState(false);
    const [draftFrom, setDraftFrom] = useState(from);
    const [draftTo, setDraftTo] = useState(to);
    const rootRef = useRef(null);
    const triggerRef = useRef(null);
    const panelRef = useRef(null);
    const placement = usePopoverPlacement(open, triggerRef, panelRef, 320);

    useEffect(() => {
        if (!open) return;
        setDraftFrom(from);
        setDraftTo(to);
    }, [open, from, to]);

    useEffect(() => {
        if (!open) return undefined;
        const onDown = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
        };
        const onKey = (event) => { if (event.key === "Escape") setOpen(false); };
        document.addEventListener("mousedown", onDown);
        window.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            window.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const activePreset = useMemo(
        () => PRESETS.find((p) => p.range.from === draftFrom && p.range.to === draftTo)?.key || null,
        [draftFrom, draftTo],
    );

    return (
        <div className="relative" ref={rootRef}>
            {fieldLabel ? (
                <span className="mb-1 block text-xs font-black tracking-wide" style={{ color: "var(--color-muted)" }}>
                    {fieldLabel}
                </span>
            ) : null}

            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen((current) => !current)}
                aria-haspopup="dialog"
                aria-expanded={open}
                className="flex h-11 w-full items-center justify-between gap-3 rounded-[1rem] border px-3.5 text-sm font-black outline-none transition hk-soft-hover"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
                <span className="flex min-w-0 items-center gap-2">
                    <Clock size={15} style={{ color: "var(--color-primary)" }} />
                    <span className="truncate tabular-nums">{label(from)} – {label(to)}</span>
                </span>
                <ChevronRight
                    size={14}
                    className="shrink-0 transition-transform duration-200"
                    style={{ color: "var(--color-muted)", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
                />
            </button>

            <AnimatePresence>
                {open ? (
                    <motion.div
                        ref={panelRef}
                        role="dialog"
                        aria-label="Choose time range"
                        data-placement={placement}
                        // Slides out of the trigger, so the entry direction
                        // matches whichever side it opened on.
                        initial={{ opacity: 0, y: placement === "top" ? 8 : -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: placement === "top" ? 8 : -8, scale: 0.98 }}
                        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                        className={`absolute z-[9200] overflow-hidden rounded-[1.5rem] border shadow-2xl ${align === "right" ? "right-0" : "left-0"} ${placement === "top" ? "bottom-full mb-2" : "top-full mt-2"}`}
                        style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                    >
                        <div className="flex flex-col sm:flex-row">
                            <ul
                                className="flex shrink-0 flex-row gap-1 overflow-x-auto border-b p-2 sm:w-36 sm:flex-col sm:border-b-0 sm:border-r sm:p-3"
                                style={{ borderColor: "var(--color-border)" }}
                            >
                                {PRESETS.map((preset) => {
                                    const isActive = activePreset === preset.key;
                                    return (
                                        <li key={preset.key}>
                                            <button
                                                type="button"
                                                aria-pressed={isActive}
                                                onClick={() => {
                                                    setDraftFrom(preset.range.from);
                                                    setDraftTo(preset.range.to);
                                                }}
                                                className="relative flex w-full items-center gap-2 whitespace-nowrap rounded-xl py-2 pl-3 pr-2 text-left text-xs font-black transition"
                                                style={{
                                                    backgroundColor: isActive
                                                        ? "color-mix(in srgb, var(--color-primary) 12%, transparent)"
                                                        : "transparent",
                                                    color: isActive ? "var(--color-primary)" : "var(--color-muted)",
                                                }}
                                            >
                                                {isActive ? (
                                                    <motion.span
                                                        layoutId="time-preset-marker"
                                                        className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full"
                                                        style={{ backgroundColor: "var(--color-primary)" }}
                                                        transition={{ type: "spring", stiffness: 500, damping: 38 }}
                                                    />
                                                ) : null}
                                                <span className="flex-1">{preset.label}</span>
                                                {isActive ? <Check size={13} className="shrink-0" /> : null}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>

                            <div className="p-4">
                                <div className="flex gap-5">
                                    <TimeColumns heading="From" value={draftFrom} onChange={setDraftFrom} />
                                    <span className="self-center text-sm font-black" style={{ color: "var(--color-muted)" }}>—</span>
                                    <TimeColumns heading="To" value={draftTo} onChange={setDraftTo} />
                                </div>

                                <div
                                    className="mt-4 flex items-center justify-between gap-3 border-t pt-4"
                                    style={{ borderColor: "var(--color-border)" }}
                                >
                                    <span className="text-xs font-black tabular-nums" style={{ color: "var(--color-text)" }}>
                                        {label(draftFrom)} – {label(draftTo)}
                                    </span>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setOpen(false)}
                                            className="rounded-xl border px-4 py-2 text-xs font-black transition hk-soft-hover"
                                            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onApply?.({ from: draftFrom, to: draftTo });
                                                setOpen(false);
                                            }}
                                            className="rounded-xl px-5 py-2 text-xs font-black transition hk-primary-hover"
                                            style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-content)" }}
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
}

/** Hour / minute / meridiem, as three scrollable columns. */
function TimeColumns({ heading, value, onChange }) {
    const parsed = parse(value) || { hour24: 0, minute: 0 };
    const { hour, meridiem } = to12(parsed.hour24);

    const set = (next) => onChange(toValue(next));

    return (
        <div>
            <p className="mb-2 text-[0.65rem] font-black uppercase tracking-[0.16em]" style={{ color: "var(--color-muted)" }}>
                {heading}
            </p>

            <div className="flex gap-1.5">
                <Column
                    values={HOURS}
                    current={hour}
                    format={(h) => String(h)}
                    onPick={(h) => set({ hour24: to24(h, meridiem), minute: parsed.minute })}
                />
                <Column
                    values={MINUTES}
                    current={parsed.minute}
                    format={(m) => String(m).padStart(2, "0")}
                    onPick={(m) => set({ hour24: parsed.hour24, minute: m })}
                />
                <div className="flex flex-col gap-1">
                    {["AM", "PM"].map((option) => {
                        const isActive = meridiem === option;
                        return (
                            <button
                                key={option}
                                type="button"
                                onClick={() => set({ hour24: to24(hour, option), minute: parsed.minute })}
                                className="rounded-lg px-2.5 py-2 text-[0.7rem] font-black transition"
                                style={{
                                    backgroundColor: isActive ? "var(--color-primary)" : "var(--color-surface)",
                                    color: isActive ? "#fff" : "var(--color-muted)",
                                }}
                            >
                                {option}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function Column({ values, current, format, onPick }) {
    return (
        <div
            className="hk-slim-scroll h-[9.5rem] w-12 overflow-y-auto rounded-xl border p-1"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
        >
            {values.map((item) => {
                const isActive = item === current;
                return (
                    <button
                        key={item}
                        type="button"
                        onClick={() => onPick(item)}
                        className="mb-0.5 block w-full rounded-lg py-1.5 text-center text-xs font-black tabular-nums transition"
                        style={{
                            backgroundColor: isActive ? "var(--color-primary)" : "transparent",
                            color: isActive ? "#fff" : "var(--color-text)",
                        }}
                    >
                        {format(item)}
                    </button>
                );
            })}
        </div>
    );
}
