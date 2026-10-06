import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarDays, X } from "lucide-react";
import CustomSelectField from "./CustomSelectField";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

// Local calendar days throughout. ISO parsing would shift dates across
// timezones — "2006-08-04" lands on the 3rd west of UTC — so days are built and
// formatted component-wise, matching DateRangePicker.
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const today = () => startOfDay(new Date());
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const sameDay = (a, b) =>
    a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const toISO = (d) =>
    d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "";

const fromISO = (value) => {
    if (!value) return null;
    const [y, m, day] = String(value).split("-").map(Number);
    if (!y || !m || !day) return null;
    return new Date(y, m - 1, day);
};

const longLabel = (d) => (d ? `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` : "");

/** Six weeks of cells so every month occupies the same height. */
function buildMonthGrid(monthDate) {
    const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const gridStart = addDays(first, -first.getDay());
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

/**
 * Single-date picker for a date of birth.
 *
 * Replaces `<input type="date">`, which rendered the browser's own control —
 * visually foreign to the rest of the admin, and awkward for a birthday because
 * reaching a year fifteen or fifty years back means clicking through months one
 * at a time. Month and year are dropdowns here, so any date is two clicks away.
 *
 * Styled to match CustomSelectField's trigger and panel so it sits in a form row
 * beside one without looking like a different control.
 *
 * @param value    ISO yyyy-mm-dd, or "" when unset
 * @param onChange receives an ISO string ("" when cleared)
 * @param maxDate  latest selectable day; defaults to today, since nobody is born
 *                 in the future
 */
export default function BirthdayPicker({
    label = "Birthday",
    value,
    onChange,
    placeholder = "Select date of birth",
    yearsBack = 100,
    maxDate = null,
    disabled = false,
    badge = null,
    error = null,
}) {
    const shouldReduceMotion = useReducedMotion();
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const panelRef = useRef(null);
    const triggerRef = useRef(null);

    // Fixed coordinates in a portal rather than an absolute panel inside the
    // form. The modal body this sits in is `overflow-y-auto`, which clips any
    // child that overflows it - an absolutely positioned calendar would be cut
    // off at the modal's edge exactly when it needed to open upward.
    const [coords, setCoords] = useState(null);

    const reposition = useCallback(() => {
        const trigger = triggerRef.current;
        if (!trigger) return;

        const rect = trigger.getBoundingClientRect();
        const panelHeight = panelRef.current?.offsetHeight || 360;
        const panelWidth = panelRef.current?.offsetWidth || 320;
        const gap = 8;

        const opensUp = rect.bottom + gap + panelHeight > window.innerHeight && rect.top > panelHeight + gap;
        const left = Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - panelWidth - 8));

        setCoords({
            top: opensUp ? rect.top - panelHeight - gap : rect.bottom + gap,
            left,
            opensUp,
        });
    }, []);

    useLayoutEffect(() => {
        if (!open) {
            setCoords(null);
            return undefined;
        }

        reposition();

        // Capture phase so scrolling ancestors (the modal body) are heard too.
        window.addEventListener("scroll", reposition, true);
        window.addEventListener("resize", reposition);
        return () => {
            window.removeEventListener("scroll", reposition, true);
            window.removeEventListener("resize", reposition);
        };
    }, [open, reposition]);

    const selected = fromISO(value);
    const latest = maxDate ? startOfDay(maxDate) : today();

    // The month on screen. Opens on the selected date so reopening returns to
    // where the user was, not to the current month.
    const [viewMonth, setViewMonth] = useState(() => selected || new Date(latest.getFullYear() - 15, latest.getMonth(), 1));

    useEffect(() => {
        if (open && selected) setViewMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    // Shaped for CustomSelectField, which takes [{ value, label }].
    const yearOptions = useMemo(() => {
        const end = latest.getFullYear();
        return Array.from({ length: yearsBack + 1 }, (_, i) => ({ value: String(end - i), label: String(end - i) }));
    }, [latest, yearsBack]);

    const monthOptions = useMemo(
        () => MONTHS.map((month, index) => ({ value: String(index), label: month })),
        [],
    );

    const days = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);

    useEffect(() => {
        if (!open) return undefined;

        const closeOnOutside = (event) => {
            if (rootRef.current?.contains(event.target)) return;
            if (panelRef.current?.contains(event.target)) return;   // panel lives outside the root now
            setOpen(false);
        };
        const closeOnEscape = (event) => {
            if (event.key === "Escape") setOpen(false);
        };

        document.addEventListener("pointerdown", closeOnOutside);
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.removeEventListener("pointerdown", closeOnOutside);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [open]);

    const pick = (day) => {
        if (day > latest) return;
        onChange?.(toISO(day));
        setOpen(false);
    };

    return (
        <div ref={rootRef} className="w-full space-y-1.5 text-left">
            <div className="flex items-center justify-between gap-2">
                {label ? (
                    <label className="block text-xs font-black tracking-wide" style={{ color: "var(--color-muted)" }}>
                        {label}
                    </label>
                ) : <span />}
                {badge}
            </div>

            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                onClick={() => setOpen((current) => !current)}
                aria-haspopup="dialog"
                aria-expanded={open}
                className={`flex h-12 w-full items-center justify-between gap-3 rounded-2xl border px-4 text-sm font-black shadow-sm outline-none transition ${
                    disabled ? "cursor-not-allowed opacity-50" : "hk-soft-hover cursor-pointer"
                }`}
                style={{
                    backgroundColor: "var(--color-card)",
                    borderColor: error
                        ? "var(--color-error)"
                        : open
                            ? "color-mix(in srgb, var(--color-primary) 45%, var(--color-border))"
                            : "var(--color-border)",
                    color: selected ? "var(--color-text)" : "var(--color-muted)",
                }}
            >
                <span className="flex min-w-0 items-center gap-2">
                    <CalendarDays size={17} style={{ color: "var(--color-primary)" }} />
                    <span className="truncate">{selected ? longLabel(selected) : placeholder}</span>
                </span>

                {selected && !disabled ? (
                    <span
                        role="button"
                        tabIndex={-1}
                        aria-label="Clear date"
                        onClick={(event) => {
                            event.stopPropagation();
                            onChange?.("");
                        }}
                        className="shrink-0 rounded-md p-0.5 transition hover:opacity-70"
                        style={{ color: "var(--color-muted)" }}
                    >
                        <X size={15} />
                    </span>
                ) : null}
            </button>

            {error ? (
                <p className="text-[0.7rem] font-bold" style={{ color: "var(--color-error)" }}>
                    {error}
                </p>
            ) : null}

            {createPortal(
                <AnimatePresence>
                    {open ? (
                        <motion.div
                            ref={panelRef}
                            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: coords?.opensUp ? 6 : -6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: coords?.opensUp ? 4 : -4, scale: 0.98 }}
                            transition={{ duration: shouldReduceMotion ? 0.01 : 0.16, ease: [0.16, 1, 0.3, 1] }}
                            className="fixed z-[9700] w-[20rem] rounded-2xl border p-3 shadow-2xl"
                            style={{
                                top: coords?.top ?? -9999,
                                left: coords?.left ?? -9999,
                                // Hidden for the first frame, before the panel has been
                                // measured — otherwise it flashes in the wrong place.
                                visibility: coords ? "visible" : "hidden",
                                backgroundColor: "var(--color-card)",
                                borderColor: "var(--color-border)",
                            }}
                            role="dialog"
                        >
                        {/* Month and year use the same CustomSelectField as Gender and
                            Program, so the calendar's controls match the rest of the
                            form. They are also the only navigation: prev/next arrows
                            offered a slower route to somewhere the dropdowns already
                            reach in one click. */}
                        <div className="flex items-center gap-2">
                            <div className="min-w-0 flex-1">
                                <CustomSelectField
                                    value={String(viewMonth.getMonth())}
                                    options={monthOptions}
                                    onChange={(next) => setViewMonth((m) => new Date(m.getFullYear(), Number(next), 1))}
                                />
                            </div>

                            <div className="w-[6.25rem] shrink-0">
                                <CustomSelectField
                                    value={String(viewMonth.getFullYear())}
                                    options={yearOptions}
                                    onChange={(next) => setViewMonth((m) => new Date(Number(next), m.getMonth(), 1))}
                                />
                            </div>
                        </div>

                        <div className="mt-3 grid grid-cols-7 gap-1">
                            {WEEKDAYS.map((day) => (
                                <span
                                    key={day}
                                    className="flex h-7 items-center justify-center text-[0.65rem] font-black uppercase"
                                    style={{ color: "var(--color-muted)" }}
                                >
                                    {day}
                                </span>
                            ))}

                            {days.map((day) => {
                                const outside = day.getMonth() !== viewMonth.getMonth();
                                const isSelected = sameDay(day, selected);
                                const isToday = sameDay(day, today());
                                const tooLate = day > latest;

                                return (
                                    <button
                                        key={day.toISOString()}
                                        type="button"
                                        disabled={tooLate}
                                        onClick={() => pick(day)}
                                        className={`flex h-9 items-center justify-center rounded-xl text-xs font-black transition ${
                                            tooLate ? "cursor-not-allowed" : "hk-soft-hover cursor-pointer"
                                        }`}
                                        style={{
                                            backgroundColor: isSelected ? "var(--color-primary)" : "transparent",
                                            color: isSelected
                                                ? "#ffffff"
                                                : tooLate
                                                    ? "color-mix(in srgb, var(--color-muted) 45%, transparent)"
                                                    : outside
                                                        ? "color-mix(in srgb, var(--color-muted) 70%, transparent)"
                                                        : "var(--color-text)",
                                            boxShadow: isToday && !isSelected
                                                ? "inset 0 0 0 1.5px color-mix(in srgb, var(--color-primary) 45%, transparent)"
                                                : "none",
                                        }}
                                    >
                                        {day.getDate()}
                                    </button>
                                );
                            })}
                            </div>
                        </motion.div>
                    ) : null}
                </AnimatePresence>,
                document.body,
            )}
        </div>
    );
}
