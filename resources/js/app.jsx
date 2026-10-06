import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import Loader from "./Global/Loader";
import { ToastProvider } from "./Global/Toast";
import { useThemeMode } from "./Global/ThemeToggle";
import AdminLayout from "./Pages/Admin/components/AdminLayout.jsx";
import DashboardSkeleton, { SkeletonBlock } from "./Pages/Admin/Dashboard/components/DashboardSkeleton.jsx";
import AnalyticsSkeleton from "./Pages/Admin/Analytics/components/AnalyticsSkeleton.jsx";
import HealthRecordsSkeleton from "./Pages/Admin/HealthRecords/components/HealthRecordsSkeleton.jsx";
import AlertsSkeleton from "./Pages/Admin/Alerts/components/AlertsSkeleton.jsx";
import ReportsSkeleton from "./Pages/Admin/Reports/components/ReportsSkeleton.jsx";
import UserAccountsSkeleton from "./Pages/Admin/Users/components/UserAccountsSkeleton.jsx";
import ActivityLogsSkeleton from "./Pages/Admin/ActivityLogs/components/ActivityLogsSkeleton.jsx";
import SettingsSkeleton from "./Pages/Admin/Settings/components/SettingsSkeleton.jsx";
import ProfileSkeleton from "./Pages/Admin/Profile/components/ProfileSkeleton.jsx";
import MeasurementsSkeleton from "./Pages/User/Measurements/components/MeasurementsSkeleton.jsx";
import UserDashboardSkeleton from "./Pages/User/Dashboard/components/DashboardSkeleton.jsx";
import { AssistantProvider } from "./Pages/User/AI-Assistant/context/AssistantProvider.jsx";
import ObjectDetectionGate from "./Pages/User/Object-Detection/ObjectDetectionGate.jsx";

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
const AdminLiveVitals = lazy(() => import("./Pages/Admin/LiveVitals/LiveVitals.jsx"));
const AdminActivityLogs = lazy(() => import("./Pages/Admin/ActivityLogs/ActivityLogs.jsx"));
const AdminSettings = lazy(() => import("./Pages/Admin/Settings/Settings.jsx"));
const AdminProfile = lazy(() => import("./Pages/Admin/Profile/Profile.jsx"));
const UserDashboard = lazy(() => import("./Pages/User/Dashboard/Dashboard.jsx"));
const Measurements = lazy(() => import("./Pages/User/Measurements/Measurements.jsx"));
const Results = lazy(() => import("./Pages/User/Results/Results.jsx"));
const UserNotifications = lazy(() => import("./Pages/User/Notifications/Notifications.jsx"));
const AlphaTesting = lazy(() => import("./ALPHA/Alpha.jsx"));

const routes = {
    "/register": Register,
    "/login": Login,
    "/verify-email": VerifyEmail,
    "/forgot-password": ForgotPassword,
    "/reset-password": ResetPassword,
    "/user/dashboard": UserDashboard,
    "/measurements": Measurements,
    "/results": Results,
    "/user/notifications": UserNotifications,
    // Internal QA questionnaire. Deliberately outside the auth guards:
    // testers need it open while they are testing the login itself.
    "/AlphaTest": AlphaTesting,
};

const ADMIN_PAGE_SKELETON_MIN_MS = 600;

const adminRoutes = {
    "/admin/dashboard": { component: AdminDashboard, eyebrow: "Admin Dashboard", title: "Health Kiosk Overview" },
    "/admin/health-records": { component: AdminHealthRecords, eyebrow: "Health Records", title: "Student and Teacher Records" },
    "/admin/analytics": { component: AdminAnalytics, eyebrow: "Data Analytics", title: "Kiosk Measurement Insights" },
    "/admin/alerts": { component: AdminAlerts, eyebrow: "Health Alerts", title: "Clinical Alert Center" },
    "/admin/reports": { component: AdminReports, eyebrow: "Reports", title: "Clinic Reports" },
    "/admin/students": { component: AdminStudents, eyebrow: "User Management", title: "Students" },
    "/admin/teachers": { component: AdminTeachers, eyebrow: "User Management", title: "Teachers" },
    "/admin/sessions": { component: AdminSessions, eyebrow: "Kiosk Sessions", title: "Session Tracking" },
    "/admin/devices": { component: AdminDevices, eyebrow: "Devices and Sensors", title: "Kiosk Hardware" },
    "/admin/live-vitals": { component: AdminLiveVitals, eyebrow: "Live IoT Monitor", title: "Real-time Health Monitoring" },
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
        return window.location.pathname === "/" ? "/login" : window.location.pathname;
    };

    const [pathname, setPathname] = useState(getCurrentPath);
    const [adminPageReady, setAdminPageReady] = useState(!getCurrentPath().startsWith("/admin/"));

    // The entry records where it was reached from, so a screen can offer a real
    // "back" instead of guessing at one fixed destination. The Notifications
    // page used to send everyone to the dashboard, including a user who had
    // opened the bell from the middle of a measurement.
    const navigate = useCallback((path) => {
        window.history.pushState({ from: getCurrentPath() }, "", path);
        setPathname(getCurrentPath());
        window.scrollTo({ top: 0, behavior: "auto" });
    }, []);

    useEffect(() => {
        if (window.location.pathname === "/") {
            window.history.replaceState({}, "", "/login");
        }

        const handlePopState = () => {
            setPathname(getCurrentPath());
        };
        window.addEventListener("popstate", handlePopState);

        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    useEffect(() => {
        if (!pathname.startsWith("/admin/")) {
            setAdminPageReady(true);
            return undefined;
        }

        setAdminPageReady(false);
        const timer = window.setTimeout(() => setAdminPageReady(true), ADMIN_PAGE_SKELETON_MIN_MS);

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

    return (
        <AssistantProvider>
            <Suspense fallback={getRouteFallback(pathname)}>
                {pathname === "/login" ? (
                    <ObjectDetectionGate navigate={navigate}>
                        <Page navigate={navigate} />
                    </ObjectDetectionGate>
                ) : (
                    <Page navigate={navigate} />
                )}
            </Suspense>
        </AssistantProvider>
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
    if (pathname === "/admin/analytics") return <AnalyticsSkeleton />;
    if (pathname === "/admin/alerts") return <AlertsSkeleton />;
    if (pathname === "/admin/reports") return <ReportsSkeleton />;
    if (pathname === "/admin/students") return <UserAccountsSkeleton type="students" />;
    if (pathname === "/admin/teachers") return <UserAccountsSkeleton type="teachers" />;
    if (pathname === "/admin/activity-logs") return <ActivityLogsSkeleton />;
    if (pathname === "/admin/settings") return <SettingsSkeleton />;
    if (pathname === "/admin/profile") return <ProfileSkeleton />;

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
