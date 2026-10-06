import { useEffect, useMemo, useState } from "react";
import { BellRing, CircleCheck, Clock3, Activity, CheckCheck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { authService, getErrorMessage } from "../../Auth/services/authService";
import { useToast } from "../../Global/Toast";
import ConfirmDialog from "../../../Global/ConfirmDialog";
import AlertsHeader from "./components/AlertsHeader";
import AlertsOverviewGrid from "./components/AlertsOverviewGrid";
import AlertsToolbar from "./components/AlertsToolbar";
import AlertsTable from "./components/AlertsTable";
import AlertDetailsDrawer from "./components/AlertDetailsDrawer";
import EmptyState from "./components/EmptyState";
import MostCommonAlerts from "./components/MostCommonAlerts";

export default function Alert({ navigate }) {
    const { showToast } = useToast();
    const [alerts, setAlerts] = useState([]);
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState({ severity: "all", status: "Pending", measurement: "all" });
    const [refreshKey, setRefreshKey] = useState(0);
    const [showResolveAllConfirm, setShowResolveAllConfirm] = useState(false);
    const [resolvingAll, setResolvingAll] = useState(false);
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        let alive = true;

        authService.adminAlerts()
            .then((response) => {
                if (alive) setAlerts(response.data?.data || []);
            })
            .catch((error) => {
                if (!alive) return;

                showToast({
                    type: "error",
                    title: "Alerts unavailable",
                    message: getErrorMessage(error, "Unable to load health alerts right now."),
                });

                if (error?.response?.status === 401 || error?.response?.status === 403) {
                    navigate("/login");
                }
            });

        return () => {
            alive = false;
        };
    }, [navigate, showToast, refreshKey]);

    const resolvedCount = alerts.filter((alert) => alert.status === "Resolved").length;
    const pendingCount = alerts.filter((alert) => alert.status === "Pending").length;
    const totalCount = alerts.length;

    const overview = useMemo(() => {
        const rate = totalCount ? Math.round((resolvedCount / totalCount) * 100) : 0;
        return [
            { label: "Pending Alerts", value: String(pendingCount), caption: "Needs clinic review", icon: Clock3 },
            { label: "Resolved Alerts", value: String(resolvedCount), caption: "Already reviewed", icon: CircleCheck },
            { label: "Total Alerts", value: String(totalCount), caption: "All time records", icon: BellRing },
            { label: "Resolution Rate", value: `${rate}%`, caption: "Clinic efficiency", icon: Activity },
        ];
    }, [pendingCount, resolvedCount, totalCount]);

    const getCategory = (title) => {
        const t = String(title).toLowerCase();
        if (t.includes("temp")) return "Temperature";
        if (t.includes("spo2") || t.includes("oxygen")) return "SpO2";
        if (t.includes("heart") || t.includes("bpm")) return "Heart Rate";
        return "Other";
    };

    const severityOptions = useMemo(() => {
        const unique = [...new Set(alerts.map(a => a.severity).filter(Boolean))].sort();
        return [{ value: "all", label: "All" }, ...unique.map(u => ({ value: u, label: u }))];
    }, [alerts]);

    const measurementOptions = useMemo(() => {
        const unique = [...new Set(alerts.map(a => getCategory(a.alertType)).filter(Boolean))].sort();
        return [{ value: "all", label: "All" }, ...unique.map(u => ({ value: u, label: u }))];
    }, [alerts]);

    const filteredAlerts = useMemo(() => {
        let filtered = alerts.filter((alert) => {
            if (filters.severity !== "all" && alert.severity !== filters.severity) return false;
            if (filters.status !== "all" && alert.status !== filters.status) return false;
            
            const category = getCategory(alert.alertType);
            if (filters.measurement !== "all" && category !== filters.measurement) return false;

            const term = search.trim().toLowerCase();
            if (!term) return true;

            return [
                alert.id,
                alert.schoolId,
                alert.fullName,
                alert.role,
                alert.alertType,
                alert.severity,
                alert.status,
            ].some((value) => String(value).toLowerCase().includes(term));
        });

        return filtered.sort((a, b) => {
            if (a.status === "Pending" && b.status !== "Pending") return -1;
            if (a.status !== "Pending" && b.status === "Pending") return 1;
            
            const dateA = new Date(a.createdAt || a.created_at);
            const dateB = new Date(b.createdAt || b.created_at);
            return dateB - dateA;
        });
    }, [alerts, search, filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Pending alerts matching the current severity filter — what "Resolve All" would act on.
    const pendingForSeverity = useMemo(
        () => alerts.filter((alert) =>
            alert.status === "Pending" &&
            (filters.severity === "all" || alert.severity === filters.severity)
        ).length,
        [alerts, filters.severity]
    );

    const handleResolveAll = async () => {
        setResolvingAll(true);
        try {
            const severity = filters.severity !== "all" ? filters.severity.toLowerCase() : null;
            const response = await authService.resolveAllAlerts(severity);
            window.dispatchEvent(new Event('refresh-alert-count'));

            showToast({
                type: "success",
                title: "Alerts resolved",
                message: response.data?.message || "Pending alerts have been resolved.",
            });

            setShowResolveAllConfirm(false);
            setRefreshKey((prev) => prev + 1);
        } catch (error) {
            showToast({
                type: "error",
                title: "Failed to resolve alerts",
                message: getErrorMessage(error, "An error occurred while resolving alerts."),
            });
        } finally {
            setResolvingAll(false);
        }
    };

    const getEmptyStateProps = () => {
        if (filters.status === "Pending") {
            return {
                title: "🎉 No pending health alerts",
                description: "All students requiring follow-up have been attended to.",
            };
        }
        if (filters.status === "Resolved") {
            return {
                title: "No resolved alerts found",
                description: "No resolved alerts match the selected filters.",
            };
        }
        return {
            title: "No health alerts found",
            description: "No health alerts match the selected filters.",
        };
    };

    return (
        <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 0.24, ease: "easeOut" }}
            className="mt-6 space-y-6"
        >
            <AlertsHeader />
            
            {Number(overview[0].value) > 0 && (
                <motion.div 
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }} 
                    animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="flex items-center gap-4 rounded-[1.25rem] border p-4 shadow-sm"
                    style={{ backgroundColor: "color-mix(in srgb, var(--color-error) 12%, transparent)", borderColor: "var(--color-error)" }}
                >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.875rem]" style={{ backgroundColor: "var(--color-error)", color: "white" }}>
                        <BellRing size={22} />
                    </div>
                    <div>
                        <h4 className="font-black" style={{ color: "var(--color-error)" }}>Action Required: Pending Alerts</h4>
                        <p className="mt-0.5 text-sm font-bold" style={{ color: "color-mix(in srgb, var(--color-error) 80%, var(--color-muted))" }}>
                            There are {overview[0].value} unresolved health alerts requiring immediate clinic review.
                        </p>
                    </div>
                </motion.div>
            )}

            <AlertsOverviewGrid metrics={overview} />
            
            <MostCommonAlerts alerts={filteredAlerts} />
            
            <AlertsToolbar 
                search={search} 
                onSearch={setSearch} 
                filters={filters}
                onFilterChange={handleFilterChange}
                severityOptions={severityOptions}
                measurementOptions={measurementOptions}
            />

            <div className="flex items-center justify-between gap-2 border-b" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex items-center gap-2">
                    {["Pending", "Resolved", "all"].map((statusOption) => {
                        const isActive = filters.status === statusOption;
                        const label = statusOption === "all" ? "All" : statusOption;
                        const count = statusOption === "Pending" ? pendingCount
                                    : statusOption === "Resolved" ? resolvedCount
                                    : totalCount;

                        return (
                            <button
                                key={statusOption}
                                onClick={() => handleFilterChange("status", statusOption)}
                                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-black transition-colors ${
                                    isActive
                                        ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                                        : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-border)]"
                                }`}
                            >
                                {label}
                                <span className={`rounded-full px-2 py-0.5 text-xs ${
                                    isActive
                                        ? "bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)]"
                                        : "bg-[var(--color-card)] border border-[var(--color-border)]"
                                }`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {pendingForSeverity > 0 && (
                    <button
                        type="button"
                        onClick={() => setShowResolveAllConfirm(true)}
                        className="mb-2 flex shrink-0 items-center gap-1.5 rounded-[0.875rem] border px-3 py-2 text-xs font-black transition hk-soft-hover"
                        style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}
                    >
                        <CheckCheck size={14} />
                        Resolve All{filters.severity !== "all" ? ` (${filters.severity})` : ""} · {pendingForSeverity}
                    </button>
                )}
            </div>

            {filteredAlerts.length ? (
                <AlertsTable alerts={filteredAlerts} onView={setSelectedAlert} />
            ) : (
                <EmptyState {...getEmptyStateProps()} />
            )}

            <AlertDetailsDrawer 
                alert={selectedAlert} 
                open={Boolean(selectedAlert)} 
                onClose={() => setSelectedAlert(null)} 
                onResolved={() => {
                    setSelectedAlert(null);
                    setRefreshKey(prev => prev + 1);
                }}
            />

            <ConfirmDialog
                open={showResolveAllConfirm}
                title="Resolve all pending alerts?"
                message={`This will resolve ${pendingForSeverity} pending alert${pendingForSeverity === 1 ? "" : "s"}${filters.severity !== "all" ? ` with severity "${filters.severity}"` : ""}. This action cannot be undone.`}
                confirmLabel="Resolve All"
                cancelLabel="Cancel"
                loading={resolvingAll}
                onConfirm={handleResolveAll}
                onCancel={() => setShowResolveAllConfirm(false)}
            />
        </motion.div>
    );
}
