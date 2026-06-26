import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Eye, Pencil, Search, Trash2, X } from "lucide-react";
import { createPortal } from "react-dom";
import ConfirmDialog from "../../../../../Global/ConfirmDialog";
import { useToast } from "../../../../../Global/Toast";
import useModalLayer from "../../../../../Global/useModalLayer";

const PAGE_SIZE = 15;

const columns = [
    { key: "firstname", label: "Firstname", className: "min-w-32" },
    { key: "lastname", label: "Lastname", className: "min-w-28" },
    { key: "student_id", label: "Student ID", className: "min-w-28" },
    { key: "email", label: "Email", className: "min-w-56 max-w-64" },
    { key: "role", label: "Role", className: "min-w-24" },
    { key: "department", label: "Department", className: "min-w-28" },
    { key: "age", label: "Age", className: "w-20" },
    { key: "gender", label: "Gender", className: "min-w-24" },
    { key: "barcode", label: "Barcode", className: "min-w-28" },
    { key: "actions", label: "Actions", className: "w-[9rem]" },
];

export default function StudentsTable({ rows = [] }) {
    const { showToast } = useToast();
    const [records, setRecords] = useState(rows);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [modalMode, setModalMode] = useState(null);
    const [form, setForm] = useState(null);
    const [recordToDelete, setRecordToDelete] = useState(null);

    useEffect(() => {
        setRecords(rows);
    }, [rows]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedSearch(search.trim().toLowerCase());
            setPage(1);
        }, 350);

        return () => window.clearTimeout(timer);
    }, [search]);

    const filteredRows = useMemo(() => {
        return records.filter((row) => {
            const haystack = [
                row.id,
                row.firstname,
                row.lastname,
                row.student_id,
                row.email,
                row.email_verified_at,
                row.role,
                row.department,
                row.age,
                row.gender,
                row.barcode,
                row.created_at,
                row.updated_at,
            ].join(" ").toLowerCase();

            const matchesSearch = debouncedSearch ? haystack.includes(debouncedSearch) : true;

            return matchesSearch;
        });
    }, [debouncedSearch, records]);

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageStart = (currentPage - 1) * PAGE_SIZE;
    const visibleRows = filteredRows.slice(pageStart, pageStart + PAGE_SIZE);
    const closeModal = () => {
        setModalMode(null);
        setForm(null);
    };
    const openView = (record) => {
        setForm(record);
        setModalMode("view");
    };
    const openEdit = (record) => {
        setForm({ ...record });
        setModalMode("edit");
    };
    const requestDelete = (record) => {
        setRecordToDelete(record);
    };
    const confirmDelete = () => {
        setRecords((current) => current.filter((item) => item.id !== recordToDelete.id));
        showToast({
            type: "success",
            title: "Student deleted",
            message: `${recordToDelete.firstname} ${recordToDelete.lastname} was removed from the table.`,
        });
        setRecordToDelete(null);
    };
    const saveRecord = () => {
        setRecords((current) => current.map((item) => item.id === form.id ? { ...form, updated_at: new Date().toISOString().slice(0, 10) } : item));
        showToast({
            type: "success",
            title: "Student updated",
            message: `${form.firstname} ${form.lastname} was updated successfully.`,
        });
        closeModal();
    };

    return (
        <section className="rounded-[14px] border p-5 shadow-xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="mb-4 flex flex-col gap-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h3 className="text-lg font-black">Records</h3>
                        <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
                            Search and filter student kiosk accounts.
                        </p>
                    </div>

                    <div className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)]">
                        <label className="flex h-11 min-w-0 items-center gap-2 rounded-xl border px-3" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                            <Search size={16} style={{ color: "var(--color-muted)" }} />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search name, barcode, ID, email..."
                                className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none"
                                style={{ color: "var(--color-text)" }}
                            />
                        </label>

                    </div>
                </div>
            </div>

            <div className="hk-reports-table-scroll max-h-[34rem] overflow-auto rounded-xl border" style={{ borderColor: "var(--color-border)" }}>
                <table className="w-full min-w-[980px] table-fixed text-left text-xs">
                    <thead className="sticky top-0 z-10" style={{ backgroundColor: "var(--color-surface)", color: "var(--color-muted)" }}>
                        <tr>
                            {columns.map((column) => (
                                <th key={column.key} className={`${column.className} border-b px-3 py-3 font-black`} style={{ borderColor: "var(--color-border)" }}>
                                    {column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {visibleRows.length ? visibleRows.map((row) => (
                            <tr key={row.id} className="transition hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,transparent)]">
                                {columns.map((column) => (
                                    <td key={column.key} className={`${column.className} border-b px-3 py-3 font-bold`} style={{ borderColor: "var(--color-border)" }}>
                                        <CellValue
                                            column={column.key}
                                            row={row}
                                            value={row[column.key]}
                                            onView={openView}
                                            onEdit={openEdit}
                                            onDelete={requestDelete}
                                        />
                                    </td>
                                ))}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm font-bold" style={{ color: "var(--color-muted)" }}>
                                    No students match the selected search or filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-bold" style={{ color: "var(--color-muted)" }}>
                    Showing {visibleRows.length ? pageStart + 1 : 0}-{Math.min(pageStart + PAGE_SIZE, filteredRows.length)} of {filteredRows.length} students
                </p>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                        disabled={currentPage === 1}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border transition hk-admin-nav-hover disabled:cursor-not-allowed disabled:opacity-45"
                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="rounded-xl border px-3 py-2 text-xs font-black" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        type="button"
                        onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                        disabled={currentPage === totalPages}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border transition hk-admin-nav-hover disabled:cursor-not-allowed disabled:opacity-45"
                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
            <RecordModal
                mode={modalMode}
                form={form}
                title={modalMode === "edit" ? "Edit student" : "View student"}
                onChange={setForm}
                onClose={closeModal}
                onSave={saveRecord}
            />
            <ConfirmDialog
                open={Boolean(recordToDelete)}
                title="Delete student?"
                message={recordToDelete ? `This will remove ${recordToDelete.firstname} ${recordToDelete.lastname} from the table.` : ""}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onCancel={() => setRecordToDelete(null)}
                onConfirm={confirmDelete}
            />
        </section>
    );
}

function CellValue({ column, row, value, onView, onEdit, onDelete }) {
    if (column === "actions") {
        return (
            <div className="flex flex-col items-stretch gap-1.5">
                <ActionButton title="View student" label="View" icon={Eye} onClick={() => onView(row)} />
                <ActionButton title="Edit student" label="Edit" icon={Pencil} onClick={() => onEdit(row)} />
                <ActionButton title="Delete student" label="Delete" icon={Trash2} danger onClick={() => onDelete(row)} />
            </div>
        );
    }

    if (column === "email") {
        return <span className="block truncate" title={value}>{value}</span>;
    }

    if (column === "email_verified_at") {
        const pending = value === "Pending";

        return (
            <span
                className="rounded-full px-2.5 py-1 text-[0.68rem] font-black"
                style={{
                    backgroundColor: pending ? "color-mix(in srgb, var(--color-primary) 10%, transparent)" : "color-mix(in srgb, var(--color-success) 10%, transparent)",
                    color: pending ? "var(--color-primary)" : "var(--color-success)",
                }}
            >
                {value}
            </span>
        );
    }

    return <span className="block truncate" title={String(value ?? "")}>{value}</span>;
}

function ActionButton({ title, label, icon: Icon, danger = false, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-[9px] border px-2.5 text-[0.68rem] font-black transition hk-admin-nav-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
                borderColor: "var(--color-border)",
                color: danger ? "var(--color-error)" : "var(--color-muted)",
            }}
            title={title}
        >
            <Icon size={14} />
            {label}
        </button>
    );
}

function RecordModal({ mode, form, title, onChange, onClose, onSave }) {
    useModalLayer(Boolean(mode));

    const editable = mode === "edit";
    const fields = ["firstname", "lastname", "student_id", "email", "email_verified_at", "role", "department", "age", "gender", "barcode", "created_at", "updated_at"];

    const modal = (
        <AnimatePresence>
            {mode && form ? (
                <motion.div
                    className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                >
                    <motion.section
                        role="dialog"
                        aria-modal="true"
                        initial={{ opacity: 0, scale: 0.96, y: 14 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 14 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="relative z-[9010] flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[24px] border shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
                        style={{ backgroundColor: "rgba(10, 10, 12, 0.96)", borderColor: "rgba(255, 255, 255, 0.08)", color: "#f8fafc" }}
                    >
                        <div className="flex items-start justify-between gap-5 border-b px-6 py-5" style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}>
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: "var(--color-primary)" }}>Student record</p>
                                <h3 className="mt-2 text-2xl font-black">{title}</h3>
                                <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">
                                    {editable ? "Update the selected student profile and account details." : "Review the selected student profile and account details."}
                                </p>
                            </div>
                            <button type="button" aria-label="Close student record modal" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border bg-white/[0.04] text-slate-200 transition hover:bg-white/[0.08]" style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="hk-reports-table-scroll grid gap-[18px] overflow-y-auto px-6 py-6 sm:grid-cols-2">
                            {fields.map((field) => (
                                <RecordField
                                    key={field}
                                    label={field.replaceAll("_", " ")}
                                    value={form[field] ?? ""}
                                    editable={editable}
                                    disabled={field === "updated_at"}
                                    onChange={(value) => onChange({ ...form, [field]: value })}
                                />
                            ))}
                        </div>
                        <div className="flex justify-end gap-3 border-t px-6 py-5" style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}>
                            <button type="button" onClick={onClose} className="rounded-[14px] border bg-white/[0.04] px-5 py-2.5 text-sm font-black text-slate-200 transition hover:bg-white/[0.08]" style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}>Close</button>
                            {editable ? (
                                <button type="button" onClick={onSave} className="rounded-[14px] px-5 py-2.5 text-sm font-black text-white transition hk-primary-hover" style={{ backgroundColor: "var(--color-primary)" }}>Save changes</button>
                            ) : null}
                        </div>
                    </motion.section>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );

    return createPortal(modal, document.body);
}

function RecordField({ label, value, editable, disabled, onChange }) {
    if (!editable) {
        return (
            <div>
                <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
                <div className="mt-2 min-h-12 rounded-[14px] border bg-black/35 px-4 py-3 text-sm font-black text-slate-100" style={{ borderColor: "rgba(255, 255, 255, 0.07)" }}>
                    {value || "—"}
                </div>
            </div>
        );
    }

    return (
        <label className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500">
            {label}
            <input
                value={value}
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
                className="mt-2 h-12 w-full rounded-[14px] border bg-black/45 px-4 text-sm font-bold text-slate-100 outline-none transition placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60 focus:shadow-[0_0_0_3px_rgba(15,118,110,0.18)]"
                style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}
            />
        </label>
    );
}
