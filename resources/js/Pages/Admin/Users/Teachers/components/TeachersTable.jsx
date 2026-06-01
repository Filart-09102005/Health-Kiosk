import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, Pencil, Search, Trash2, X } from "lucide-react";
import ConfirmDialog from "../../../../../Global/ConfirmDialog";
import { useToast } from "../../../../../Global/Toast";

const PAGE_SIZE = 10;

const columns = [
    { key: "id", label: "ID", className: "w-14" },
    { key: "firstname", label: "Firstname", className: "min-w-32" },
    { key: "lastname", label: "Lastname", className: "min-w-28" },
    { key: "student_id", label: "Teacher ID", className: "min-w-28" },
    { key: "email", label: "Email", className: "min-w-56 max-w-64" },
    { key: "email_verified_at", label: "Email Verified At", className: "min-w-36" },
    { key: "role", label: "Role", className: "min-w-24" },
    { key: "department", label: "Department", className: "min-w-28" },
    { key: "age", label: "Age", className: "w-20" },
    { key: "gender", label: "Gender", className: "min-w-24" },
    { key: "barcode", label: "Barcode", className: "min-w-28" },
    { key: "created_at", label: "Created At", className: "min-w-28" },
    { key: "updated_at", label: "Updated At", className: "min-w-28" },
    { key: "actions", label: "Actions", className: "w-24" },
];

export default function TeachersTable({ rows = [] }) {
    const { showToast } = useToast();
    const [records, setRecords] = useState(rows);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [department, setDepartment] = useState("all");
    const [role, setRole] = useState("all");
    const [verification, setVerification] = useState("all");
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

    useEffect(() => {
        setPage(1);
    }, [department, role, verification]);

    const departments = useMemo(() => uniqueOptions(records, "department"), [records]);
    const roles = useMemo(() => uniqueOptions(records, "role"), [records]);

    const filteredRows = useMemo(() => {
        return records.filter((row) => {
            const haystack = Object.values(row).join(" ").toLowerCase();
            const isVerified = row.email_verified_at !== "Pending";

            return (debouncedSearch ? haystack.includes(debouncedSearch) : true)
                && (department === "all" || row.department === department)
                && (role === "all" || row.role === role)
                && (verification === "all"
                    || (verification === "verified" && isVerified)
                    || (verification === "pending" && !isVerified));
        });
    }, [debouncedSearch, department, records, role, verification]);

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
            title: "Teacher deleted",
            message: `${recordToDelete.firstname} ${recordToDelete.lastname} was removed from the table.`,
        });
        setRecordToDelete(null);
    };
    const saveRecord = () => {
        setRecords((current) => current.map((item) => item.id === form.id ? { ...form, updated_at: new Date().toISOString().slice(0, 10) } : item));
        showToast({
            type: "success",
            title: "Teacher updated",
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
                            Search and filter teacher kiosk accounts.
                        </p>
                    </div>

                    <div className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_auto_auto_auto]">
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

                        <FilterSelect label="Department" value={department} onChange={setDepartment}>
                            <option value="all">All departments</option>
                            {departments.map((item) => <option key={item} value={item}>{item}</option>)}
                        </FilterSelect>

                        <FilterSelect label="Role" value={role} onChange={setRole}>
                            <option value="all">All roles</option>
                            {roles.map((item) => <option key={item} value={item}>{item}</option>)}
                        </FilterSelect>

                        <FilterSelect label="Verification" value={verification} onChange={setVerification}>
                            <option value="all">All status</option>
                            <option value="verified">Verified</option>
                            <option value="pending">Pending</option>
                        </FilterSelect>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--color-border)" }}>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1260px] table-fixed text-left text-xs">
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
                                        No teachers match the selected search or filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-bold" style={{ color: "var(--color-muted)" }}>
                    Showing {visibleRows.length ? pageStart + 1 : 0}-{Math.min(pageStart + PAGE_SIZE, filteredRows.length)} of {filteredRows.length} teachers
                </p>
                <div className="flex items-center gap-2">
                    <PageButton disabled={currentPage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} icon={ChevronLeft} />
                    <span className="rounded-xl border px-3 py-2 text-xs font-black" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>
                        Page {currentPage} of {totalPages}
                    </span>
                    <PageButton disabled={currentPage === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} icon={ChevronRight} />
                </div>
            </div>
            <RecordModal
                mode={modalMode}
                form={form}
                title={modalMode === "edit" ? "Edit teacher" : "View teacher"}
                onChange={setForm}
                onClose={closeModal}
                onSave={saveRecord}
            />
            <ConfirmDialog
                open={Boolean(recordToDelete)}
                title="Delete teacher?"
                message={recordToDelete ? `This will remove ${recordToDelete.firstname} ${recordToDelete.lastname} from the table.` : ""}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onCancel={() => setRecordToDelete(null)}
                onConfirm={confirmDelete}
            />
        </section>
    );
}

function FilterSelect({ label, value, onChange, children }) {
    return (
        <label>
            <span className="sr-only">{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-11 min-w-36 rounded-xl border px-3 text-sm font-black outline-none"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
                {children}
            </select>
        </label>
    );
}

function CellValue({ column, row, value, onView, onEdit, onDelete }) {
    if (column === "actions") {
        return (
            <div className="flex items-center gap-1.5">
                <ActionButton title="View" icon={Eye} onClick={() => onView(row)} />
                <ActionButton title="Edit" icon={Pencil} onClick={() => onEdit(row)} />
                <ActionButton title="Delete" icon={Trash2} danger onClick={() => onDelete(row)} />
            </div>
        );
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

function ActionButton({ title, icon: Icon, danger = false, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex p-1 transition hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ color: danger ? "var(--color-error)" : "var(--color-muted)" }}
            title={title}
        >
            <Icon size={16} />
        </button>
    );
}

function PageButton({ disabled, onClick, icon: Icon }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="flex h-9 w-9 items-center justify-center rounded-xl border transition hk-admin-nav-hover disabled:cursor-not-allowed disabled:opacity-45"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
            <Icon size={16} />
        </button>
    );
}

function uniqueOptions(rows, key) {
    return [...new Set(rows.map((row) => row[key]).filter(Boolean))];
}

function RecordModal({ mode, form, title, onChange, onClose, onSave }) {
    if (!mode || !form) return null;

    const editable = mode === "edit";
    const fields = ["firstname", "lastname", "student_id", "email", "email_verified_at", "role", "department", "age", "gender", "barcode", "created_at", "updated_at"];

    return (
        <div className="fixed inset-0 z-[950] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
            <section className="w-full max-w-3xl rounded-[16px] border shadow-2xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                <div className="flex items-center justify-between border-b p-5" style={{ borderColor: "var(--color-border)" }}>
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-primary)" }}>Teacher record</p>
                        <h3 className="mt-1 text-xl font-black">{title}</h3>
                    </div>
                    <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl border transition hk-admin-nav-hover" style={{ borderColor: "var(--color-border)" }}>
                        <X size={18} />
                    </button>
                </div>
                <div className="grid max-h-[70vh] gap-3 overflow-y-auto p-5 sm:grid-cols-2">
                    {fields.map((field) => (
                        <label key={field} className="text-xs font-black uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
                            {field === "student_id" ? "teacher id" : field.replaceAll("_", " ")}
                            <input
                                value={form[field] ?? ""}
                                disabled={!editable || field === "updated_at"}
                                onChange={(event) => onChange({ ...form, [field]: event.target.value })}
                                className="mt-2 h-11 w-full rounded-xl border px-3 text-sm font-bold outline-none disabled:opacity-70"
                                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                            />
                        </label>
                    ))}
                </div>
                <div className="flex justify-end gap-3 border-t p-5" style={{ borderColor: "var(--color-border)" }}>
                    <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 text-sm font-black transition hk-admin-nav-hover" style={{ borderColor: "var(--color-border)" }}>Close</button>
                    {editable ? (
                        <button type="button" onClick={onSave} className="rounded-xl px-4 py-2 text-sm font-black text-white transition hk-primary-hover" style={{ backgroundColor: "var(--color-primary)" }}>Save changes</button>
                    ) : null}
                </div>
            </section>
        </div>
    );
}
