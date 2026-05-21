import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import Loader from "./Global/Loader";
import { ToastProvider } from "./Global/Toast";
import { useThemeMode } from "./Global/ThemeToggle";
import AdminLayout from "./Pages/Admin/components/AdminLayout.jsx";
import DashboardSkeleton, { ADMIN_DASHBOARD_SKELETON_MIN_MS, AdminShellSkeleton, SkeletonBlock } from "./Pages/Admin/Dashboard/components/DashboardSkeleton.jsx";
import HealthRecordsSkeleton from "./Pages/Admin/HealthRecords/components/HealthRecordsSkeleton.jsx";
import MeasurementsSkeleton from "./Pages/User/Measurements/components/MeasurementsSkeleton.jsx";
import UserDashboardSkeleton from "./Pages/User/Dashboard/components/DashboardSkeleton.jsx";

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
    const fullAdminSkeleton = useRef(getCurrentPath().startsWith("/admin/"));

    const navigate = useCallback((path) => {
        fullAdminSkeleton.current = false;
        window.history.pushState({}, "", path);
        setPathname(getCurrentPath());
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    useEffect(() => {
        if (window.location.pathname === "/") {
            window.history.replaceState({}, "", "/register");
        }

        const handlePopState = () => {
            fullAdminSkeleton.current = false;
            setPathname(getCurrentPath());
        };
        window.addEventListener("popstate", handlePopState);

        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    useEffect(() => {
        if (!pathname.startsWith("/admin/")) {
            setAdminPageReady(true);
            fullAdminSkeleton.current = false;
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
        const fallback = fullAdminSkeleton.current ? (
            <AdminShellSkeleton>{contentSkeleton}</AdminShellSkeleton>
        ) : (
            <AdminLayout navigate={navigate} pathname={pathname} eyebrow={adminRoute.eyebrow} title={adminRoute.title}>
                {contentSkeleton}
            </AdminLayout>
        );

        if (!adminPageReady) {
            return fallback;
        }

        return (
            <Suspense fallback={fallback}>
                <AdminLayout navigate={navigate} pathname={pathname} eyebrow={adminRoute.eyebrow} title={adminRoute.title}>
                    <AdminPage navigate={navigate} />
                </AdminLayout>
            </Suspense>
        );
    }

    const Page = routes[pathname] || Register;

    return (
        <Suspense fallback={getRouteFallback(pathname)}>
            <Page navigate={navigate} />
        </Suspense>
    );
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
