import { useEffect, useMemo, useState } from "react";
import { BellRing, CircleCheck, Clock3 } from "lucide-react";
import { authService, getErrorMessage } from "../../Auth/services/authService";
import { useToast } from "../../Global/Toast";
import AlertsHeader from "./components/AlertsHeader";
import AlertsOverviewGrid from "./components/AlertsOverviewGrid";
import AlertsToolbar from "./components/AlertsToolbar";
import AlertsTable from "./components/AlertsTable";
import AlertDetailsDrawer from "./components/AlertDetailsDrawer";
import EmptyState from "./components/EmptyState";

export default function Alert({ navigate }) {
    const { showToast } = useToast();
    const [alerts, setAlerts] = useState([]);
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [search, setSearch] = useState("");

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
    }, [navigate, showToast]);

    const overview = useMemo(() => {
        const resolvedCount = alerts.filter((alert) => alert.status === "Resolved").length;
        const pendingCount = alerts.filter((alert) => alert.status === "Pending").length;

        return [
            { label: "Total Alerts", value: String(alerts.length), caption: "Users with alert records", icon: BellRing },
            { label: "Pending", value: String(pendingCount), caption: "Needs clinic review", icon: Clock3 },
            { label: "Resolved", value: String(resolvedCount), caption: "Already reviewed", icon: CircleCheck },
        ];
    }, [alerts]);

    const filteredAlerts = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (!term) return alerts;

        return alerts.filter((alert) => [
            alert.id,
            alert.schoolId,
            alert.fullName,
            alert.role,
            alert.alertType,
            alert.severity,
            alert.status,
        ].some((value) => String(value).toLowerCase().includes(term)));
    }, [alerts, search]);

    return (
        <div className="mt-5 space-y-5">
            <AlertsHeader />
            <AlertsOverviewGrid metrics={overview} />
            <AlertsToolbar search={search} onSearch={setSearch} />

            {filteredAlerts.length ? (
                <AlertsTable alerts={filteredAlerts} onView={setSelectedAlert} />
            ) : (
                <EmptyState title="No matching alerts" description="Try adjusting severity, status, date range, or search terms." />
            )}

            <AlertDetailsDrawer alert={selectedAlert} open={Boolean(selectedAlert)} onClose={() => setSelectedAlert(null)} />
        </div>
    );
}
