import { ChevronLeft, ChevronRight, Gauge } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { authService, getErrorMessage } from "../../Auth/services/authService";
import { useToast } from "../../Global/Toast";
import AdminShell from "../components/AdminShell";
import AdminModulePage from "../components/AdminModulePage";

const PAGE_SIZE = 15;
const columns = ["Actor", "Action", "Area", "Status", "Time", "Details"];

export default function ActivityLogs({ navigate }) {
    const { showToast } = useToast();
    const [rows, setRows] = useState([]);

    useEffect(() => {
        let alive = true;

        authService.adminActivityLogs({ per_page: 100 })
            .then((response) => {
                if (alive) setRows((response.data?.data || []).map(formatActivityLog));
            })
            .catch((error) => {
                if (!alive) return;

                showToast({
                    type: "error",
                    title: "Activity logs unavailable",
                    message: getErrorMessage(error, "Unable to load activity logs right now."),
                });

                if (error?.response?.status === 401 || error?.response?.status === 403) {
                    navigate("/login");
                }
            });

        return () => {
            alive = false;
        };
    }, [navigate, showToast]);

    return (
        <AdminShell navigate={navigate} eyebrow="Activity Logs" title="Audit Trail">
            <AdminModulePage
                icon={Gauge}
                eyebrow="System activity"
                title="Activity Logs"
                description="Review login attempts, session actions, admin changes, receipt printing, and security events."
                showHeaderActions={false}
            >
                <ActivityLogsTable rows={rows} />
            </AdminModulePage>
        </AdminShell>
    );
}

function formatActivityLog(log) {
    const actor = log.user
        ? `${log.user.firstname || ""} ${log.user.lastname || ""}`.trim() || log.user.email
        : "System";

    return {
        id: log.id,
        Actor: actor,
        Action: log.action?.replaceAll("_", " ") || "Activity",
        Area: inferArea(log.action),
        Status: inferStatus(log.action),
        Time: log.created_at ? new Date(log.created_at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" }) : "N/A",
        Details: log.description || "No details recorded",
    };
}

function inferArea(action = "") {
    if (action.includes("dashboard")) return "Dashboard";
    if (action.includes("user")) return "User Management";
    if (action.includes("health")) return "Health Records";
    if (action.includes("session")) return "Kiosk Sessions";
    if (action.includes("report") || action.includes("export")) return "Reports";
    if (action.includes("login") || action.includes("auth")) return "Authentication";

    return "System";
}

function inferStatus(action = "") {
    if (action.includes("failed") || action.includes("invalid")) return "Failed";
    if (action.includes("alert")) return "Alert";

    return "Success";
}

function ActivityLogsTable({ rows = [] }) {
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageStart = (currentPage - 1) * PAGE_SIZE;
    const visibleRows = useMemo(() => rows.slice(pageStart, pageStart + PAGE_SIZE), [pageStart, rows]);

    return (
        <section className="rounded-[14px] border p-5 shadow-xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h3 className="text-lg font-black">Activity log</h3>
                    <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
                        Administrative, authentication, system, and kiosk audit events.
                    </p>
                </div>
                <p className="text-xs font-black" style={{ color: "var(--color-muted)" }}>
                    Showing {visibleRows.length ? pageStart + 1 : 0}-{Math.min(pageStart + PAGE_SIZE, rows.length)} of {rows.length}
                </p>
            </div>

            <div className="hk-reports-table-scroll max-h-[34rem] overflow-auto rounded-xl border" style={{ borderColor: "var(--color-border)" }}>
                <table className="w-full min-w-[1040px] table-fixed text-left text-xs">
                    <thead className="sticky top-0 z-10" style={{ backgroundColor: "var(--color-surface)", color: "var(--color-muted)" }}>
                        <tr>
                            {columns.map((column) => (
                                <th key={column} className="border-b px-3 py-3 text-[0.68rem] font-black uppercase tracking-wide" style={{ borderColor: "var(--color-border)" }}>
                                    {column}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {visibleRows.map((row) => (
                            <tr key={row.id} className="transition hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,transparent)]">
                                {columns.map((column) => (
                                    <td key={column} className="border-b px-3 py-3.5 font-bold" style={{ borderColor: "var(--color-border)" }}>
                                        {column === "Status" ? <StatusBadge status={row[column]} /> : <span className="block truncate" title={String(row[column] ?? "")}>{row[column]}</span>}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
                <PageButton disabled={currentPage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} icon={ChevronLeft} />
                <span className="rounded-xl border px-3 py-2 text-xs font-black" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>
                    Page {currentPage} of {totalPages}
                </span>
                <PageButton disabled={currentPage === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} icon={ChevronRight} />
            </div>
        </section>
    );
}

function StatusBadge({ status }) {
    const color = status === "Success"
        ? "var(--color-success)"
        : status === "Failed"
            ? "var(--color-error)"
            : "var(--color-primary)";

    return (
        <span
            className="rounded-full px-2.5 py-1 text-[0.68rem] font-black"
            style={{
                backgroundColor: "color-mix(in srgb, currentColor 10%, transparent)",
                color,
            }}
        >
            {status}
        </span>
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
