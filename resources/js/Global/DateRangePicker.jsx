import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarRange, Check, ChevronLeft, ChevronRight } from "lucide-react";
import usePopoverPlacement from "./usePopoverPlacement";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// ── Date helpers ──────────────────────────────────────────────────────────
// Everything is handled as a local calendar day. Using ISO parsing here would
// shift dates across timezones — "2026-08-04" would land on the 3rd west of
// UTC — so days are built and formatted component-wise.
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const today = () => startOfDay(new Date());
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const sameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const toISO = (d) => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "");
const fromISO = (value) => {
    if (!value) return null;
    const [y, m, day] = String(value).split("-").map(Number);
    if (!y || !m || !day) return null;
    return new Date(y, m - 1, day);
};
const shortLabel = (d) => (d ? `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}` : "");

const PRESETS = [
    { key: "today", label: "Today", range: () => ({ from: today(), to: today() }) },
    { key: "yesterday", label: "Yesterday", range: () => ({ from: addDays(today(), -1), to: addDays(today(), -1) }) },
    { key: "7d", label: "Last 7 days", range: () => ({ from: addDays(today(), -6), to: today() }) },
    { key: "30d", label: "Last 30 days", range: () => ({ from: addDays(today(), -29), to: today() }) },
    { key: "6m", label: "Last 6 months", range: () => ({ from: addMonths(today(), -6), to: today() }) },
    { key: "1y", label: "Last year", range: () => ({ from: addMonths(today(), -12), to: today() }) },
    { key: "all", label: "All time", range: () => ({ from: null, to: null }) },
];

/** Six weeks of cells so every month occupies the same height. */
function buildMonthGrid(monthDate) {
    const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const gridStart = addDays(first, -first.getDay());
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

/**
 * Two-month range picker with preset shortcuts.
 *
 * Selection is held as a draft while the popover is open — nothing reaches the
 * caller until Apply, so a half-finished range (start picked, end not) never
 * triggers a refetch.
 *
 * @param from  ISO yyyy-mm-dd, or "" for open-ended
 * @param to    ISO yyyy-mm-dd, or "" for open-ended
 * @param onApply  ({ from, to }) with ISO strings
 */
export default function DateRangePicker({ from, to, onApply, label = "Date range", align = "left" }) {
    const [open, setOpen] = useState(false);
    const [draftFrom, setDraftFrom] = useState(fromISO(from));
    const [draftTo, setDraftTo] = useState(fromISO(to));
    const [hover, setHover] = useState(null);
    // Each calendar navigates on its own, so you can hold one month still while
    // moving the other — the common case when a range spans an odd gap.
    const [views, setViews] = useState(() => {
        const base = fromISO(from) || today();
        return [startOfMonth(base), addMonths(base, 1)];
    });
    const rootRef = useRef(null);
    const triggerRef = useRef(null);
    const panelRef = useRef(null);
    const placement = usePopoverPlacement(open, triggerRef, panelRef, 420);

    const setViewAt = (index, date) =>
        setViews((current) => current.map((value, i) => (i === index ? startOfMonth(date) : value)));

    // Re-sync whenever the popover opens so Cancel is always a true revert.
    useEffect(() => {
        if (!open) return;
        setDraftFrom(fromISO(from));
        setDraftTo(fromISO(to));
        setHover(null);
        const base = fromISO(from) || today();
        setViews([startOfMonth(base), addMonths(base, 1)]);
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

    // Tracks the draft, not the applied value — once a preset is clicked it
    // should look chosen straight away, even though Apply has not run yet.
    const activePreset = useMemo(() => {
        return PRESETS.find((preset) => {
            const r = preset.range();
            if (!r.from && !r.to) return !draftFrom && !draftTo;
            return sameDay(r.from, draftFrom) && sameDay(r.to, draftTo);
        })?.key || null;
    }, [draftFrom, draftTo]);

    const triggerLabel = useMemo(() => {
        const f = fromISO(from);
        const t = fromISO(to);
        if (!f && !t) return "All time";
        if (f && t) return `${shortLabel(f)} – ${shortLabel(t)}`;
        return f ? `From ${shortLabel(f)}` : `Until ${shortLabel(t)}`;
    }, [from, to]);

    // While picking an end date, preview against whatever is hovered.
    const previewTo = draftFrom && !draftTo && hover ? hover : draftTo;
    const rangeStart = draftFrom && previewTo && previewTo < draftFrom ? previewTo : draftFrom;
    const rangeEnd = draftFrom && previewTo && previewTo < draftFrom ? draftFrom : previewTo;

    const pickDay = (day) => {
        if (!draftFrom || (draftFrom && draftTo)) {
            setDraftFrom(day);
            setDraftTo(null);
            return;
        }
        if (day < draftFrom) {
            setDraftTo(draftFrom);
            setDraftFrom(day);
        } else {
            setDraftTo(day);
        }
    };

    const apply = () => {
        onApply?.({ from: toISO(rangeStart), to: toISO(rangeEnd || rangeStart) });
        setOpen(false);
    };

    return (
        <div className="relative" ref={rootRef}>
            {label ? (
                <span className="mb-1 block text-xs font-black tracking-wide" style={{ color: "var(--color-muted)" }}>
                    {label}
                </span>
            ) : null}

            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen((current) => !current)}
                aria-haspopup="dialog"
                aria-expanded={open}
                className="flex h-12 w-full items-center justify-between gap-3 rounded-2xl border px-4 text-sm font-black shadow-sm outline-none transition hk-soft-hover"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
                <span className="flex min-w-0 items-center gap-2">
                    <CalendarRange size={15} style={{ color: "var(--color-primary)" }} />
                    <span className="truncate">{triggerLabel}</span>
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
                        aria-label="Choose date range"
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
                            {/* Presets — the answer to most range questions, so
                                they sit first rather than behind the calendar. */}
                            <ul
                                className="flex shrink-0 flex-row gap-1 overflow-x-auto border-b p-2 sm:w-40 sm:flex-col sm:border-b-0 sm:border-r sm:p-3"
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
                                                    // Stage it only. The picker stays open so the
                                                    // choice can be seen on the calendar and
                                                    // adjusted before Apply commits it.
                                                    const r = preset.range();
                                                    setDraftFrom(r.from);
                                                    setDraftTo(r.to);
                                                    setHover(null);
                                                    if (r.from) {
                                                        setViews([startOfMonth(r.from), addMonths(r.from, 1)]);
                                                    }
                                                }}
                                                className="relative flex w-full items-center gap-2 whitespace-nowrap rounded-xl py-2 pl-3 pr-2 text-left text-xs font-black transition"
                                                style={{
                                                    backgroundColor: isActive
                                                        ? "color-mix(in srgb, var(--color-primary) 12%, transparent)"
                                                        : "transparent",
                                                    color: isActive ? "var(--color-primary)" : "var(--color-muted)",
                                                }}
                                            >
                                                {/* Accent bar reads at a glance even when the
                                                    tint is subtle against the surface. */}
                                                {isActive ? (
                                                    <motion.span
                                                        layoutId="range-preset-marker"
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
                                <div className="flex gap-6">
                                    {views.map((month, index) => (
                                        <MonthGrid
                                            key={index}
                                            month={month}
                                            rangeStart={rangeStart}
                                            rangeEnd={rangeEnd}
                                            onPick={pickDay}
                                            onHover={setHover}
                                            onChangeMonth={(next) => setViewAt(index, next)}
                                        />
                                    ))}
                                </div>

                                <div
                                    className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between"
                                    style={{ borderColor: "var(--color-border)" }}
                                >
                                    <div className="flex items-center gap-2">
                                        <Field value={rangeStart ? shortLabel(rangeStart) : "Start"} />
                                        <span style={{ color: "var(--color-muted)" }}>—</span>
                                        <Field value={rangeEnd ? shortLabel(rangeEnd) : "End"} />
                                    </div>

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
                                            onClick={apply}
                                            disabled={!rangeStart}
                                            className="rounded-xl px-5 py-2 text-xs font-black transition hk-primary-hover disabled:opacity-50"
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

function MonthGrid({ month, rangeStart, rangeEnd, onPick, onHover, onChangeMonth }) {
    const days = buildMonthGrid(month);
    const now = today();
    const [picking, setPicking] = useState(null); // "month" | "year" | null

    const years = useMemo(() => {
        const base = now.getFullYear();
        return Array.from({ length: 21 }, (_, i) => base - 12 + i);
    }, [now]);

    return (
        <div className="relative w-[15rem]">
            {/* Both calendars step on their own, and the month and year are
                separately selectable — moving one no longer drags the other. */}
            <div className="mb-3 flex items-center justify-between gap-1">
                <Arrow onClick={() => onChangeMonth(addMonths(month, -1))} label="Previous month">
                    <ChevronLeft size={15} />
                </Arrow>

                <div className="flex items-center gap-1">
                    <HeaderButton active={picking === "month"} onClick={() => setPicking(picking === "month" ? null : "month")}>
                        {MONTHS[month.getMonth()]}
                    </HeaderButton>
                    <HeaderButton active={picking === "year"} onClick={() => setPicking(picking === "year" ? null : "year")}>
                        {month.getFullYear()}
                    </HeaderButton>
                </div>

                <Arrow onClick={() => onChangeMonth(addMonths(month, 1))} label="Next month">
                    <ChevronRight size={15} />
                </Arrow>
            </div>

            <AnimatePresence>
                {picking ? (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.14 }}
                        className="absolute inset-x-0 top-10 z-20 rounded-2xl border p-2 shadow-xl"
                        style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                    >
                        {picking === "month" ? (
                            <div className="grid grid-cols-3 gap-1">
                                {MONTHS.map((name, index) => {
                                    const isActive = index === month.getMonth();
                                    return (
                                        <button
                                            key={name}
                                            type="button"
                                            onClick={() => {
                                                onChangeMonth(new Date(month.getFullYear(), index, 1));
                                                setPicking(null);
                                            }}
                                            className="rounded-lg px-2 py-2 text-[0.7rem] font-black transition"
                                            style={{
                                                backgroundColor: isActive ? "var(--color-primary)" : "transparent",
                                                color: isActive ? "#fff" : "var(--color-text)",
                                            }}
                                        >
                                            {name.slice(0, 3)}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="hk-slim-scroll grid max-h-48 grid-cols-3 gap-1 overflow-y-auto">
                                {years.map((year) => {
                                    const isActive = year === month.getFullYear();
                                    return (
                                        <button
                                            key={year}
                                            type="button"
                                            onClick={() => {
                                                onChangeMonth(new Date(year, month.getMonth(), 1));
                                                setPicking(null);
                                            }}
                                            className="rounded-lg px-2 py-2 text-[0.7rem] font-black tabular-nums transition"
                                            style={{
                                                backgroundColor: isActive ? "var(--color-primary)" : "transparent",
                                                color: isActive ? "#fff" : "var(--color-text)",
                                            }}
                                        >
                                            {year}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <div className="grid grid-cols-7 gap-y-1">
                {WEEKDAYS.map((day) => (
                    <span key={day} className="pb-1 text-center text-[0.65rem] font-black" style={{ color: "var(--color-muted)" }}>
                        {day}
                    </span>
                ))}

                {days.map((day) => {
                    const outside = day.getMonth() !== month.getMonth();
                    const isStart = sameDay(day, rangeStart);
                    const isEnd = sameDay(day, rangeEnd);
                    const inRange = rangeStart && rangeEnd && day > rangeStart && day < rangeEnd;
                    const isToday = sameDay(day, now);
                    const edge = isStart || isEnd;

                    return (
                        <button
                            key={day.toISOString()}
                            type="button"
                            onClick={() => onPick(day)}
                            onMouseEnter={() => onHover(day)}
                            className="relative flex h-8 items-center justify-center text-xs font-bold transition-colors"
                            style={{
                                // The band runs edge to edge so a selected range
                                // reads as one continuous strip, not dots.
                                backgroundColor: inRange
                                    ? "color-mix(in srgb, var(--color-primary) 12%, transparent)"
                                    : "transparent",
                                borderTopLeftRadius: isStart ? "0.5rem" : 0,
                                borderBottomLeftRadius: isStart ? "0.5rem" : 0,
                                borderTopRightRadius: isEnd ? "0.5rem" : 0,
                                borderBottomRightRadius: isEnd ? "0.5rem" : 0,
                                color: edge ? "#fff" : outside ? "var(--color-muted)" : "var(--color-text)",
                                opacity: outside && !edge && !inRange ? 0.4 : 1,
                            }}
                        >
                            {edge ? (
                                <span
                                    aria-hidden="true"
                                    className="absolute inset-y-0 left-1/2 w-8 -translate-x-1/2 rounded-lg"
                                    style={{ backgroundColor: "var(--color-primary)" }}
                                />
                            ) : null}
                            <span className="relative z-10">{day.getDate()}</span>
                            {isToday && !edge ? (
                                <span
                                    aria-hidden="true"
                                    className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
                                    style={{ backgroundColor: "var(--color-primary)" }}
                                />
                            ) : null}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function HeaderButton({ active, onClick, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-expanded={active}
            className="rounded-lg px-2 py-1 text-sm font-black transition hk-soft-hover"
            style={{
                backgroundColor: active ? "color-mix(in srgb, var(--color-primary) 12%, transparent)" : "transparent",
                color: active ? "var(--color-primary)" : "var(--color-text)",
            }}
        >
            {children}
        </button>
    );
}

function Arrow({ onClick, label, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            className="flex h-7 w-7 items-center justify-center rounded-lg transition hk-soft-hover"
            style={{ color: "var(--color-muted)" }}
        >
            {children}
        </button>
    );
}

function Field({ value }) {
    return (
        <span
            className="rounded-xl border px-3 py-2 text-xs font-black"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
        >
            {value}
        </span>
    );
}
