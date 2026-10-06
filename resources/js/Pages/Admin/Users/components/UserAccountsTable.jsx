import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Pencil, Search, Trash2, UsersRound, X, ShieldCheck, CheckCircle2, MoreVertical, UserX, UserCheck } from "lucide-react";
import { authService, getErrorMessage } from "../../../Auth/services/authService";
import ConfirmDialog from "../../../../Global/ConfirmDialog";
import UndoSnackbar, { UNDO_WINDOW_MS } from "../../../../Global/UndoSnackbar";
import { useToast } from "../../../../Global/Toast";
import UserAvatar from "./UserAvatar";
import UserRecordModal from "./UserRecordModal";
import TablePagination from "../../../../Global/TablePagination";

const PAGE_SIZE = 15;

// Pagination is client-side, so there is no request to wait on. This brief
// skeleton is a transition affordance — it keeps the eye from jumping when a
// whole page of rows swaps at once — not a stand-in for real loading.
const PAGE_TRANSITION_MS = 320;

/**
 * Account table shared by the Students and Teachers screens.
 *
 * Both screens previously carried a near-identical copy of this file, which is
 * how they drifted apart in the first place. Behaviour is unchanged: same
 * search, same pagination, same view / edit / delete calls.
 *
 * @param idLabel  Column heading for the identifier ("Student ID" / "Teacher ID")
 * @param noun     Singular noun used in copy and toasts ("student" / "teacher")
 */
export default function UserAccountsTable({ rows = [], idLabel = "ID", noun = "user" }) {
    const { showToast } = useToast();
    const [records, setRecords] = useState(rows);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [modalMode, setModalMode] = useState(null);
    const [form, setForm] = useState(null);
    const [recordToDelete, setRecordToDelete] = useState(null);
    const [recordToVerify, setRecordToVerify] = useState(null);
    const [recordToToggleActive, setRecordToToggleActive] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [togglingActive, setTogglingActive] = useState(false);
    const [pageLoading, setPageLoading] = useState(false);

    // A delete that has been applied on screen but not yet sent. Held until the
    // undo window closes, so "undo" means the request never happens rather than
    // trying to recreate a deleted account.
    const [pendingDelete, setPendingDelete] = useState(null);
    const pendingDeleteRef = useRef(null);
    pendingDeleteRef.current = pendingDelete;

    const Noun = noun.charAt(0).toUpperCase() + noun.slice(1);

    const columns = useMemo(() => ([
        { key: "identity", label: "Name", className: "min-w-[15rem]" },
        { key: "student_id", label: idLabel, className: "min-w-28" },
        { key: "role", label: "Role", className: "min-w-24" },
        { key: "department", label: "Department", className: "min-w-32" },
        { key: "birthday", label: "Birthday", className: "min-w-28" },
        { key: "age", label: "Age", className: "w-16" },
        { key: "gender", label: "Gender", className: "min-w-24" },
        { key: "barcode", label: "Barcode", className: "min-w-28" },
        { key: "actions", label: "", className: "w-14 sticky right-0" },
    ]), [idLabel]);

    useEffect(() => { setRecords(rows); }, [rows]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedSearch(search.trim().toLowerCase());
            setPage(1);
        }, 350);

        return () => window.clearTimeout(timer);
    }, [search]);

    const filteredRows = useMemo(() => {
        if (!debouncedSearch) return records;
        return records.filter((row) => Object.values(row).join(" ").toLowerCase().includes(debouncedSearch));
    }, [debouncedSearch, records]);

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageStart = (currentPage - 1) * PAGE_SIZE;
    const visibleRows = filteredRows.slice(pageStart, pageStart + PAGE_SIZE);

    const closeModal = () => { setModalMode(null); setForm(null); };
    const openView = (record) => { setForm(record); setModalMode("view"); };
    const openEdit = (record) => { setForm({ ...record }); setModalMode("edit"); };

    // Actually send the delete. Called when the undo window closes, or on
    // unmount so a pending delete is never silently dropped.
    const commitDelete = useCallback(async (record) => {
        if (!record) return;

        try {
            const response = await authService.adminDeleteUser(record.id);

            // The account still exists when the backend deactivates instead of
            // deleting (it has health records on file) - the row was already
            // removed from view optimistically, so this is the only place the
            // admin finds out it wasn't actually deleted.
            if (response?.data?.deactivated) {
                showToast({
                    type: "info",
                    title: `${Noun} deactivated, not deleted`,
                    message: response.data.message
                        || `${record.firstname} ${record.lastname} has health records on file, so the account was deactivated instead of permanently deleted.`,
                });
            }
        } catch (error) {
            // Put the row back — it was only ever removed optimistically.
            setRecords((current) =>
                current.some((item) => item.id === record.id) ? current : [...current, record].sort((a, b) => a.id - b.id));
            showToast({
                type: "error",
                title: "Delete failed",
                message: getErrorMessage(error, `Unable to delete ${noun}. The record has been restored.`),
            });
        }
    }, [noun, showToast]);

    const confirmDelete = () => {
        const record = recordToDelete;
        if (!record) return;

        // If another delete is still waiting, commit it now rather than losing it.
        if (pendingDeleteRef.current) commitDelete(pendingDeleteRef.current);

        setDeleting(true);
        setRecords((current) => current.filter((item) => item.id !== record.id));
        setPendingDelete(record);
        setRecordToDelete(null);
        setDeleting(false);
    };

    const undoDelete = () => {
        const record = pendingDeleteRef.current;
        if (!record) return;

        setPendingDelete(null);
        setRecords((current) =>
            current.some((item) => item.id === record.id) ? current : [...current, record].sort((a, b) => a.id - b.id));
        showToast({
            type: "info",
            title: "Deletion undone",
            message: `${record.firstname} ${record.lastname} was restored.`,
        });
    };

    const expireDelete = useCallback(() => {
        const record = pendingDeleteRef.current;
        if (!record) return;

        setPendingDelete(null);
        commitDelete(record);
    }, [commitDelete]);

    // Leaving the page must not cancel a delete the user already confirmed.
    useEffect(() => () => {
        if (pendingDeleteRef.current) commitDelete(pendingDeleteRef.current);
    }, [commitDelete]);

    // Brief skeleton while a new page of rows swaps in.
    const goToPage = (updater) => {
        setPage((current) => {
            const next = updater(current);
            if (next !== current) setPageLoading(true);
            return next;
        });
    };

    useEffect(() => {
        if (!pageLoading) return undefined;
        const timer = window.setTimeout(() => setPageLoading(false), PAGE_TRANSITION_MS);
        return () => window.clearTimeout(timer);
    }, [pageLoading, currentPage]);

    const saveRecord = async () => {
        setSaving(true);
        try {
            const response = await authService.adminUpdateUser(form.id, form);
            const updatedUser = response.data.user;

            const isStudentPage = noun.toLowerCase() === "student";
            const isTeacherRole = ["teacher", "personnel", "staff", "faculty"].includes(updatedUser.role);
            
            let shouldKeep = true;
            if (isStudentPage && updatedUser.role !== "student") shouldKeep = false;
            if (!isStudentPage && !isTeacherRole) shouldKeep = false;

            if (shouldKeep) {
                setRecords((current) => current.map((item) => (item.id === form.id ? { ...item, ...updatedUser } : item)));
            } else {
                setRecords((current) => current.filter((item) => item.id !== form.id));
            }

            showToast({
                type: "success",
                title: `${Noun} updated`,
                message: `${form.firstname} ${form.lastname} was updated successfully.`,
            });
            closeModal();
        } catch (error) {
            showToast({ type: "error", title: "Update failed", message: getErrorMessage(error, `Unable to update ${noun} right now.`) });
        } finally {
            setSaving(false);
        }
    };

    const confirmVerify = async () => {
        const record = recordToVerify;
        if (!record) return;

        setVerifying(true);
        try {
            const response = await authService.adminVerifyUser(record.id);
            const updatedUser = response.data.user;
            setRecords((current) => current.map((item) => (item.id === record.id ? { ...item, ...updatedUser } : item)));
            showToast({
                type: "success",
                title: `${Noun} verified`,
                message: `${record.firstname} ${record.lastname} was verified successfully.`,
            });
            setRecordToVerify(null);
        } catch (error) {
            showToast({ type: "error", title: "Verification failed", message: getErrorMessage(error, `Unable to verify ${noun}.`) });
        } finally {
            setVerifying(false);
        }
    };

    const confirmToggleActive = async () => {
        const record = recordToToggleActive;
        if (!record) return;

        setTogglingActive(true);
        try {
            const response = await authService.adminToggleUserActive(record.id);
            const updatedUser = response.data.user;
            setRecords((current) => current.map((item) => (item.id === record.id ? { ...item, ...updatedUser } : item)));
            showToast({
                type: "success",
                title: updatedUser.is_active ? `${Noun} activated` : `${Noun} deactivated`,
                message: response.data.message,
            });
            setRecordToToggleActive(null);
        } catch (error) {
            showToast({ type: "error", title: "Update failed", message: getErrorMessage(error, `Unable to update ${noun}.`) });
        } finally {
            setTogglingActive(false);
        }
    };

    return (
        <section
            className="overflow-hidden rounded-[1.75rem] border shadow-sm"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
            {/* ── Toolbar ── */}
            <div
                className="flex flex-col gap-4 border-b px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
                style={{ borderColor: "var(--color-border)" }}
            >
                <div className="min-w-0">
                    <h3 className="text-base font-black" style={{ color: "var(--color-text)" }}>Records</h3>
                    <p className="mt-0.5 text-xs font-semibold" style={{ color: "var(--color-muted)" }}>
                        {filteredRows.length} {filteredRows.length === 1 ? noun : `${noun}s`}
                        {debouncedSearch ? ` matching “${debouncedSearch}”` : " on file"}
                    </p>
                </div>

                <label
                    className="flex h-11 w-full min-w-0 items-center gap-2.5 rounded-2xl border px-3.5 transition focus-within:ring-2 lg:w-80"
                    style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                >
                    <Search size={16} style={{ color: "var(--color-muted)" }} />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder={`Search ${noun}s…`}
                        className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
                        style={{ color: "var(--color-text)" }}
                    />
                    {search ? (
                        <button
                            type="button"
                            onClick={() => setSearch("")}
                            aria-label="Clear search"
                            className="rounded-lg p-1 transition hover:opacity-70"
                            style={{ color: "var(--color-muted)" }}
                        >
                            <X size={14} />
                        </button>
                    ) : null}
                </label>
            </div>

            {/* ── Table ── */}
            <div className="hk-slim-scroll max-h-[36rem] overflow-auto">
                <table className="w-full min-w-[62rem] text-left text-xs">
                    <thead className="sticky top-0 z-10">
                        <tr style={{ backgroundColor: "var(--color-surface)" }}>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={`${column.className} border-b px-4 py-3 text-[0.68rem] font-black uppercase tracking-[0.1em]`}
                                    style={{
                                        borderColor: "var(--color-border)",
                                        color: "var(--color-muted)",
                                        backgroundColor: column.key === "actions" ? "var(--color-surface)" : undefined,
                                        boxShadow: column.key === "actions" ? "-1px 0 0 var(--color-border)" : undefined,
                                    }}
                                >
                                    {column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {pageLoading ? (
                            Array.from({ length: Math.max(3, visibleRows.length || PAGE_SIZE) }).map((_, index) => (
                                <SkeletonRow key={`skeleton-${index}`} columns={columns} />
                            ))
                        ) : visibleRows.length ? visibleRows.map((row, index) => (
                            <motion.tr
                                key={row.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.18, delay: Math.min(index * 0.012, 0.15) }}
                                className="group transition-colors hover:bg-[color-mix(in_srgb,var(--color-primary)_5%,transparent)]"
                            >
                                {columns.map((column) => (
                                    <td
                                        key={column.key}
                                        className={`${column.className} border-b px-4 py-3 align-middle font-bold`}
                                        style={{
                                            borderColor: "color-mix(in srgb, var(--color-border) 55%, transparent)",
                                            backgroundColor: column.key === "actions" ? "var(--color-card)" : undefined,
                                            boxShadow: column.key === "actions" ? "-1px 0 0 var(--color-border)" : undefined,
                                        }}
                                    >
                                        <Cell
                                            column={column.key}
                                            row={row}
                                            noun={noun}
                                            onView={openView}
                                            onEdit={openEdit}
                                            onVerify={setRecordToVerify}
                                            onDelete={setRecordToDelete}
                                            onToggleActive={setRecordToToggleActive}
                                        />
                                    </td>
                                ))}
                            </motion.tr>
                        )) : (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-16 text-center">
                                    <div
                                        className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
                                        style={{ backgroundColor: "var(--color-surface)", color: "var(--color-muted)" }}
                                    >
                                        <UsersRound size={24} />
                                    </div>
                                    <p className="text-sm font-black" style={{ color: "var(--color-text)" }}>
                                        {debouncedSearch ? `No ${noun}s match your search` : `No ${noun}s yet`}
                                    </p>
                                    <p className="mt-1 text-xs font-semibold" style={{ color: "var(--color-muted)" }}>
                                        {debouncedSearch ? "Try a different name, ID, or barcode." : `Accounts will appear here once added.`}
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── Pagination ── */}
            <div className="border-t px-5 py-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <TablePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalRecords={filteredRows.length}
                    pageSize={PAGE_SIZE}
                    noun={noun}
                    onPageChange={(next) => goToPage(() => next)}
                />
            </div>

            <UserRecordModal
                mode={modalMode}
                form={form}
                eyebrow={`${Noun} record`}
                title={modalMode === "edit" ? `Edit ${noun}` : `View ${noun}`}
                onChange={setForm}
                onClose={closeModal}
                onSave={saveRecord}
                saving={saving}
            />

            <ConfirmDialog
                open={Boolean(recordToDelete)}
                title={`Delete ${noun} permanently?`}
                message={recordToDelete ? `This will permanently delete ${recordToDelete.firstname} ${recordToDelete.lastname}'s account and all associated health records, kiosk sessions, and measurements. You can undo this for a few seconds afterwards — after that, it cannot be undone.` : ""}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                loading={deleting}
                onCancel={() => setRecordToDelete(null)}
                onConfirm={confirmDelete}
            />

            <ConfirmDialog
                open={Boolean(recordToVerify)}
                title={`Verify ${noun}?`}
                message={recordToVerify ? `${recordToVerify.firstname} ${recordToVerify.lastname} will be marked as verified. They will be able to sign in without completing email verification.` : ""}
                confirmLabel="Verify"
                cancelLabel="Cancel"
                loading={verifying}
                onCancel={() => setRecordToVerify(null)}
                onConfirm={confirmVerify}
            />

            <ConfirmDialog
                open={Boolean(recordToToggleActive)}
                title={recordToToggleActive?.is_active === false ? `Activate ${noun}?` : `Deactivate ${noun}?`}
                message={recordToToggleActive ? (
                    recordToToggleActive.is_active === false
                        ? `${recordToToggleActive.firstname} ${recordToToggleActive.lastname} will be able to sign in again.`
                        : `${recordToToggleActive.firstname} ${recordToToggleActive.lastname} will no longer be able to sign in. Their account and records are kept, and this can be undone at any time from here.`
                ) : ""}
                confirmLabel={recordToToggleActive?.is_active === false ? "Activate" : "Deactivate"}
                cancelLabel="Cancel"
                loading={togglingActive}
                onCancel={() => setRecordToToggleActive(null)}
                onConfirm={confirmToggleActive}
            />

            <UndoSnackbar
                open={Boolean(pendingDelete)}
                message={`${Noun} deleted`}
                detail={pendingDelete ? `${pendingDelete.firstname} ${pendingDelete.lastname}` : ""}
                duration={UNDO_WINDOW_MS}
                onUndo={undoDelete}
                onExpire={expireDelete}
            />
        </section>
    );
}

function SkeletonRow({ columns }) {
    return (
        <tr aria-hidden="true">
            {columns.map((column) => (
                <td
                    key={column.key}
                    className={`${column.className} border-b px-4 py-3`}
                    style={{
                        borderColor: "color-mix(in srgb, var(--color-border) 55%, transparent)",
                        backgroundColor: column.key === "actions" ? "var(--color-card)" : undefined,
                        boxShadow: column.key === "actions" ? "-1px 0 0 var(--color-border)" : undefined,
                    }}
                >
                    {column.key === "identity" ? (
                        <div className="flex items-center gap-3">
                            <div className="hk-skeleton-shimmer h-[34px] w-[34px] shrink-0 rounded-full" />
                            <div className="min-w-0 flex-1 space-y-1.5">
                                <div className="hk-skeleton-shimmer h-3 w-28 rounded-md" />
                                <div className="hk-skeleton-shimmer h-2.5 w-40 rounded-md" />
                            </div>
                        </div>
                    ) : column.key === "actions" ? (
                        <div className="flex items-center justify-center">
                            <div className="hk-skeleton-shimmer h-8 w-8 rounded-xl" />
                        </div>
                    ) : (
                        <div className="hk-skeleton-shimmer h-3 w-16 rounded-md" />
                    )}
                </td>
            ))}
        </tr>
    );
}

function Cell({ column, row, noun, onView, onEdit, onVerify, onDelete, onToggleActive }) {
    if (column === "identity") {
        return (
            <div className="flex min-w-0 items-center gap-3">
                <UserAvatar firstname={row.firstname} lastname={row.lastname} />
                <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-1.5">
                        <p className="truncate text-[0.8rem] font-black" style={{ color: "var(--color-text)" }}>
                            {`${row.firstname || ""} ${row.lastname || ""}`.trim() || "—"}
                        </p>
                        {row.is_active === false ? (
                            <span
                                className="shrink-0 rounded-full px-1.5 py-0.5 text-[0.6rem] font-black uppercase tracking-wide"
                                style={{
                                    backgroundColor: "color-mix(in srgb, var(--color-error) 12%, transparent)",
                                    color: "var(--color-error)",
                                }}
                            >
                                Inactive
                            </span>
                        ) : null}
                    </div>
                    <p className="truncate text-[0.7rem] font-semibold" style={{ color: "var(--color-muted)" }} title={row.email}>
                        {row.email || "—"}
                    </p>
                </div>
            </div>
        );
    }

    if (column === "actions") {
        return (
            <div className="flex items-center justify-center">
                <ActionsMenu row={row} noun={noun} onView={onView} onEdit={onEdit} onVerify={onVerify} onDelete={onDelete} onToggleActive={onToggleActive} />
            </div>
        );
    }

    if (column === "role" || column === "department") {
        if (!row[column]) return <span style={{ color: "var(--color-muted)" }}>—</span>;
        return <Badge value={row[column]} tone={column === "role" ? "primary" : "neutral"} />;
    }

    if (column === "birthday") {
        return (
            <span className="block truncate">
                {row.birthday ? new Date(row.birthday).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
            </span>
        );
    }

    const value = row[column];
    return <span className="block truncate" title={String(value ?? "")}>{value || <span style={{ color: "var(--color-muted)" }}>—</span>}</span>;
}

function Badge({ value, tone }) {
    const primary = tone === "primary";

    return (
        <span
            className="inline-block max-w-full truncate rounded-full px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-wide"
            style={{
                backgroundColor: primary
                    ? "color-mix(in srgb, var(--color-primary) 11%, transparent)"
                    : "var(--color-surface)",
                color: primary ? "var(--color-primary)" : "var(--color-muted)",
                border: primary ? "none" : "1px solid var(--color-border)",
            }}
            title={value}
        >
            {value}
        </span>
    );
}

const MENU_WIDTH = 200;
const MENU_GAP = 6;

/**
 * Row actions collapsed behind a single "⋮" trigger. The table used to lay
 * all four icon buttons out inline, which is what pushed the actions column
 * past the table's min-width and off screen on smaller viewports — one
 * trigger fits inside the sticky actions column at any width.
 */
function ActionsMenu({ row, noun, onView, onEdit, onVerify, onDelete, onToggleActive }) {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState(null);
    const triggerRef = useRef(null);
    const menuRef = useRef(null);

    const updatePosition = useCallback(() => {
        const trigger = triggerRef.current;
        if (!trigger) return;

        const rect = trigger.getBoundingClientRect();
        const menuHeight = 214;
        const openUpward = rect.bottom + menuHeight + MENU_GAP > window.innerHeight && rect.top - menuHeight - MENU_GAP > 0;

        setCoords({
            top: openUpward ? rect.top - menuHeight - MENU_GAP : rect.bottom + MENU_GAP,
            left: Math.max(8, rect.right - MENU_WIDTH),
        });
    }, []);

    useEffect(() => {
        if (!open) return undefined;
        updatePosition();

        const handleOutside = (event) => {
            if (menuRef.current?.contains(event.target) || triggerRef.current?.contains(event.target)) return;
            setOpen(false);
        };
        const handleKeyDown = (event) => { if (event.key === "Escape") setOpen(false); };

        window.addEventListener("scroll", updatePosition, true);
        window.addEventListener("resize", updatePosition);
        document.addEventListener("mousedown", handleOutside);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("scroll", updatePosition, true);
            window.removeEventListener("resize", updatePosition);
            document.removeEventListener("mousedown", handleOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, updatePosition]);

    const verified = Boolean(row.email_verified_at);
    const active = row.is_active !== false;

    const items = [
        { key: "view", label: `View ${noun}`, icon: Eye, onSelect: () => onView(row) },
        { key: "edit", label: `Edit ${noun}`, icon: Pencil, onSelect: () => onEdit(row) },
        verified
            ? { key: "verify", label: "Verified", icon: CheckCircle2, tone: "success", disabled: true }
            : { key: "verify", label: `Verify ${noun}`, icon: ShieldCheck, onSelect: () => onVerify(row) },
        active
            ? { key: "toggle-active", label: `Deactivate ${noun}`, icon: UserX, danger: true, onSelect: () => onToggleActive(row) }
            : { key: "toggle-active", label: `Activate ${noun}`, icon: UserCheck, tone: "success", onSelect: () => onToggleActive(row) },
        { key: "delete", label: `Delete ${noun}`, icon: Trash2, danger: true, onSelect: () => onDelete(row) },
    ];

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen((current) => !current)}
                title={`${noun} actions`}
                aria-label={`${noun} actions`}
                aria-haspopup="menu"
                aria-expanded={open}
                className="flex h-8 w-8 items-center justify-center rounded-full border transition hover:scale-105 active:scale-95"
                style={{
                    backgroundColor: open ? "var(--color-surface)" : "var(--color-card)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-muted)",
                }}
            >
                <MoreVertical size={15} />
            </button>

            {open && coords ? createPortal(
                <AnimatePresence>
                    <motion.div
                        ref={menuRef}
                        role="menu"
                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.12 }}
                        className="fixed z-[9200] w-[12.5rem] rounded-2xl border p-1.5 shadow-2xl"
                        style={{
                            top: coords.top,
                            left: coords.left,
                            backgroundColor: "var(--color-card)",
                            borderColor: "var(--color-border)",
                        }}
                    >
                        {items.map((item) => (
                            <MenuItem
                                key={item.key}
                                {...item}
                                onClick={() => {
                                    if (item.disabled) return;
                                    setOpen(false);
                                    item.onSelect();
                                }}
                            />
                        ))}
                    </motion.div>
                </AnimatePresence>,
                document.body,
            ) : null}
        </>
    );
}

function MenuItem({ label, icon: Icon, danger = false, tone, disabled = false, onClick }) {
    const color = danger
        ? "var(--color-error)"
        : tone === "success"
            ? "var(--color-success)"
            : "var(--color-text)";

    return (
        <button
            type="button"
            role="menuitem"
            disabled={disabled}
            onClick={onClick}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition disabled:cursor-default"
            style={{
                color,
                backgroundColor: "transparent",
                opacity: disabled ? 0.75 : 1,
            }}
            onMouseEnter={(event) => { if (!disabled) event.currentTarget.style.backgroundColor = "var(--color-surface)"; }}
            onMouseLeave={(event) => { event.currentTarget.style.backgroundColor = "transparent"; }}
        >
            <Icon size={15} />
            <span className="truncate">{label}</span>
        </button>
    );
}
