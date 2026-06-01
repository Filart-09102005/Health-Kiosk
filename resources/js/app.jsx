import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import Loader from "./Global/Loader";
import { ToastProvider } from "./Global/Toast";
import { useThemeMode } from "./Global/ThemeToggle";
import AdminLayout from "./Pages/Admin/components/AdminLayout.jsx";
import DashboardSkeleton, { ADMIN_DASHBOARD_SKELETON_MIN_MS, SkeletonBlock } from "./Pages/Admin/Dashboard/components/DashboardSkeleton.jsx";
import HealthRecordsSkeleton from "./Pages/Admin/HealthRecords/components/HealthRecordsSkeleton.jsx";
import MeasurementsSkeleton from "./Pages/User/Measurements/components/MeasurementsSkeleton.jsx";
import UserDashboardSkeleton from "./Pages/User/Dashboard/components/DashboardSkeleton.jsx";
import { AssistantProvider } from "./Pages/User/AI-Assistant/context/AssistantProvider.jsx";
import AssistantIdleGate from "./Pages/User/AI-Assistant/components/AssistantIdleGate.jsx";

const Register = lazy(() => import("./Pages/Auth/Register.jsx"));
const Login = lazy(() => import("./Pages/Auth/Login.jsx"));
const VerifyEmail = lazy(() => import("./Pages/Auth/VerifyEmail.jsx"));
const ForgotPassword = lazy(() => import("./Pages/Auth/ForgotPassword.jsx"));
const ResetPassword = lazy(() => import("./Pages/Auth/ResetPassword.jsx"));
const AdminDashboard = lazy(() => import("./Pages/Admin/Dashboard/Dashboard.jsx"));
const AdminHealthRecords = lazy(() => import("./Pages/Admin/HealthRecords/HealthRecords.jsx"));
const AdminAnalytics = lazy(() => import("./Pages/Admin/Analytics/Analytics.jsx"));
const AdminAlerts = lazy(() => import("./Pages/Admin/Alerts/Alert.jsx"));
const AdminReports = lazy(() => import("./Pages/Admin/Reports/Reports.jsx"));
const AdminStudents = lazy(() => import("./Pages/Admin/Users/Students/Students.jsx"));
const AdminTeachers = lazy(() => import("./Pages/Admin/Users/Teachers/Teachers.jsx"));
const AdminSessions = lazy(() => import("./Pages/Admin/Sessions/Sessions.jsx"));
const AdminDevices = lazy(() => import("./Pages/Admin/Devices/Devices.jsx"));
const AdminActivityLogs = lazy(() => import("./Pages/Admin/ActivityLogs/ActivityLogs.jsx"));
const AdminSettings = lazy(() => import("./Pages/Admin/Settings/Settings.jsx"));
const AdminProfile = lazy(() => import("./Pages/Admin/Profile/Profile.jsx"));
const UserDashboard = lazy(() => import("./Pages/User/Dashboard/Dashboard.jsx"));
const Measurements = lazy(() => import("./Pages/User/Measurements/Measurements.jsx"));
const Results = lazy(() => import("./Pages/User/Results/Results.jsx"));

const routes = {
    "/register": Register,
    "/login": Login,
    "/verify-email": VerifyEmail,
    "/forgot-password": ForgotPassword,
    "/reset-password": ResetPassword,
    "/user/dashboard": UserDashboard,
    "/measurements": Measurements,
    "/results": Results,
};

const MAINTENANCE_KEY = "healthKioskMaintenanceUntil";
const kioskRestrictedRoutes = new Set(["/register", "/user/dashboard", "/measurements", "/results"]);

const adminRoutes = {
    "/admin/dashboard": { component: AdminDashboard, eyebrow: "Admin Dashboard", title: "Health Kiosk Overview" },
    "/admin/health-records": { component: AdminHealthRecords, eyebrow: "Health Records", title: "Student and Teacher Records" },
    "/admin/analytics": { component: AdminAnalytics, eyebrow: "Measurement Analytics", title: "Kiosk Measurement Insights" },
    "/admin/alerts": { component: AdminAlerts, eyebrow: "Health Alerts", title: "Clinical Alert Center" },
    "/admin/reports": { component: AdminReports, eyebrow: "Reports", title: "Clinic Reports" },
    "/admin/students": { component: AdminStudents, eyebrow: "User Management", title: "Students" },
    "/admin/teachers": { component: AdminTeachers, eyebrow: "User Management", title: "Teachers" },
    "/admin/sessions": { component: AdminSessions, eyebrow: "Kiosk Sessions", title: "Session Tracking" },
    "/admin/devices": { component: AdminDevices, eyebrow: "Devices and Sensors", title: "Kiosk Hardware" },
    "/admin/activity-logs": { component: AdminActivityLogs, eyebrow: "Activity Logs", title: "Audit Trail" },
    "/admin/settings": { component: AdminSettings, eyebrow: "System Settings", title: "Admin Settings" },
    "/admin/profile": { component: AdminProfile, eyebrow: "Account", title: "Admin Profile" },
};

export default function App() {
    useThemeMode();

    return (
        <ToastProvider>
            <Router />
        </ToastProvider>
    );
}

function Router() {
    const getCurrentPath = () => {
        return window.location.pathname === "/" ? "/register" : window.location.pathname;
    };

    const [pathname, setPathname] = useState(getCurrentPath);
    const [adminPageReady, setAdminPageReady] = useState(!getCurrentPath().startsWith("/admin/"));
    const [maintenanceUntil, setMaintenanceUntil] = useState(() => Number(window.localStorage.getItem(MAINTENANCE_KEY) || 0));
    const [maintenanceNow, setMaintenanceNow] = useState(Date.now());

    const navigate = useCallback((path) => {
        window.history.pushState({}, "", path);
        setPathname(getCurrentPath());
        window.scrollTo({ top: 0, behavior: "auto" });
    }, []);

    useEffect(() => {
        if (window.location.pathname === "/") {
            window.history.replaceState({}, "", "/register");
        }

        const handlePopState = () => {
            setPathname(getCurrentPath());
        };
        window.addEventListener("popstate", handlePopState);

        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    useEffect(() => {
        const refreshMaintenance = () => {
            setMaintenanceUntil(Number(window.localStorage.getItem(MAINTENANCE_KEY) || 0));
            setMaintenanceNow(Date.now());
        };
        const timer = window.setInterval(() => setMaintenanceNow(Date.now()), 1000);

        window.addEventListener("storage", refreshMaintenance);
        window.addEventListener("health-kiosk-maintenance-change", refreshMaintenance);

        return () => {
            window.clearInterval(timer);
            window.removeEventListener("storage", refreshMaintenance);
            window.removeEventListener("health-kiosk-maintenance-change", refreshMaintenance);
        };
    }, []);

    useEffect(() => {
        if (!pathname.startsWith("/admin/")) {
            setAdminPageReady(true);
            return undefined;
        }

        setAdminPageReady(false);
        const delay = pathname === "/admin/dashboard" ? ADMIN_DASHBOARD_SKELETON_MIN_MS : 1200;
        const timer = window.setTimeout(() => setAdminPageReady(true), delay);

        return () => window.clearTimeout(timer);
    }, [pathname]);

    const adminRoute = adminRoutes[pathname];

    if (adminRoute) {
        const AdminPage = adminRoute.component;
        const contentSkeleton = getAdminContentSkeleton(pathname);

        return (
            <AdminLayout navigate={navigate} pathname={pathname} eyebrow={adminRoute.eyebrow} title={adminRoute.title} loadingHeader={false}>
                {!adminPageReady ? (
                    contentSkeleton
                ) : (
                    <Suspense fallback={contentSkeleton}>
                    <AdminPage navigate={navigate} />
                    </Suspense>
                )}
            </AdminLayout>
        );
    }

    const Page = routes[pathname] || Register;
    const maintenanceActive = maintenanceUntil > maintenanceNow;

    if (maintenanceActive && kioskRestrictedRoutes.has(pathname)) {
        return <KioskMaintenanceScreen remaining={maintenanceUntil - maintenanceNow} navigate={navigate} />;
    }

    return (
        <AssistantProvider>
            <Suspense fallback={getRouteFallback(pathname)}>
                {pathname === "/login" ? (
                    <AssistantIdleGate>
                        <Page navigate={navigate} />
                    </AssistantIdleGate>
                ) : (
                    <Page navigate={navigate} />
                )}
            </Suspense>
        </AssistantProvider>
    );
}

function KioskMaintenanceScreen({ remaining, navigate }) {
    return (
        <main className="flex min-h-screen items-center justify-center p-6" style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
            <section className="w-full max-w-xl rounded-[20px] border p-8 text-center shadow-2xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: "var(--color-primary)" }}>
                    Kiosk Maintenance
                </p>
                <h1 className="mt-3 text-3xl font-black">Kiosk temporarily unavailable</h1>
                <p className="mt-3 text-sm font-semibold leading-6" style={{ color: "var(--color-muted)" }}>
                    The health kiosk is under admin maintenance. Users can access the kiosk again when the countdown ends.
                </p>
                <div className="mt-6 rounded-2xl border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                    <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-muted)" }}>Time remaining</p>
                    <p className="mt-2 text-4xl font-black" style={{ color: "var(--color-primary)" }}>{formatMaintenanceCountdown(remaining)}</p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="mt-6 rounded-xl border px-4 py-3 text-sm font-black transition hk-soft-hover"
                    style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                >
                    Admin Login
                </button>
            </section>
        </main>
    );
}

function formatMaintenanceCountdown(milliseconds) {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getRouteFallback(pathname) {
    if (pathname === "/user/dashboard") return <UserDashboardSkeleton />;
    if (pathname === "/measurements") return <MeasurementsSkeleton />;

    return <Loader label="Loading Health Kiosk" fullscreen />;
}

function getAdminContentSkeleton(pathname) {
    if (pathname === "/admin/dashboard") return <DashboardSkeleton />;
    if (pathname === "/admin/health-records") return <HealthRecordsSkeleton />;

    return <GenericAdminContentSkeleton />;
}

function GenericAdminContentSkeleton() {
    return (
        <div className="mt-6 space-y-6" aria-busy="true" aria-label="Loading admin page">
            <section className="rounded-2xl border p-5 shadow-xl" style={{ backgroundColor: "color-mix(in srgb, var(--color-card) 94%, transparent)", borderColor: "var(--color-border)" }}>
                <SkeletonBlock className="h-3 w-40" />
                <SkeletonBlock className="mt-3 h-8 w-72 max-w-full" />
                <SkeletonBlock className="mt-3 h-4 w-[42rem] max-w-full" />
            </section>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="rounded-2xl border p-5 shadow-xl" style={{ backgroundColor: "color-mix(in srgb, var(--color-card) 94%, transparent)", borderColor: "var(--color-border)" }}>
                        <SkeletonBlock className="h-7 w-7" />
                        <SkeletonBlock className="mt-5 h-8 w-20" />
                        <SkeletonBlock className="mt-3 h-3 w-32" />
                    </div>
                ))}
            </section>
            <section className="rounded-2xl border p-5 shadow-xl" style={{ backgroundColor: "color-mix(in srgb, var(--color-card) 94%, transparent)", borderColor: "var(--color-border)" }}>
                <SkeletonBlock className="h-10 w-full max-w-md" />
                <div className="mt-5 space-y-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <SkeletonBlock key={index} className="h-12 w-full" />
                    ))}
                </div>
            </section>
        </div>
    );
}
