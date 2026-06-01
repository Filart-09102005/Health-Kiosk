import Header from "./Header";
import Sidebar from "./Sidebar";
import { useToast } from "../../Global/Toast";
import { authService, getErrorMessage } from "../../Auth/services/authService";

export default function AdminLayout({
    navigate,
    pathname,
    eyebrow = "Admin Console",
    title = "Health Kiosk Admin",
    loadingHeader = false,
    children,
}) {
    const { showToast } = useToast();

    const logout = async () => {
        try {
            await authService.logout();
            showToast({ type: "info", title: "Logged out", message: "Your admin session has ended." });
        } catch (error) {
            const status = error?.response?.status;

            if (status !== 401 && status !== 419) {
                showToast({
                    type: "error",
                    title: "Logout failed",
                    message: getErrorMessage(error, "Please try logging out again."),
                });
                return;
            }

            showToast({ type: "info", title: "Session ended", message: "Please sign in again." });
        }

        navigate("/login");
    };

    return (
        <main className="hk-page min-h-screen lg:flex" style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
            <Sidebar navigate={navigate} pathname={pathname} />

            <section className="min-w-0 flex-1 px-4 py-6 lg:pl-0 lg:pr-6">
                <div className="mx-auto max-w-[90rem]">
                    {loadingHeader ? <AdminHeaderSkeleton /> : <Header onLogout={logout} eyebrow={eyebrow} title={title} />}
                    {children}
                </div>
            </section>
        </main>
    );
}

function HeaderSkeletonBlock({ className = "" }) {
    return <div className={`hk-skeleton-shimmer rounded-xl ${className}`} aria-hidden="true" />;
}

function AdminHeaderSkeleton() {
    return (
        <header
            className="sticky top-6 z-20 rounded-2xl border p-4 shadow-xl backdrop-blur-xl sm:p-5"
            style={{
                backgroundColor: "color-mix(in srgb, var(--color-card) 92%, transparent)",
                borderColor: "var(--color-border)",
            }}
            aria-busy="true"
            aria-label="Loading admin header"
        >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                    <HeaderSkeletonBlock className="h-3 w-36" />
                    <HeaderSkeletonBlock className="mt-3 h-8 w-72 max-w-full" />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                    <HeaderSkeletonBlock className="h-11 w-32 rounded-xl" />
                    <HeaderSkeletonBlock className="h-11 w-11 rounded-xl" />
                    <div
                        className="flex h-[3.25rem] w-48 items-center gap-3 rounded-xl border px-3"
                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                    >
                        <HeaderSkeletonBlock className="h-9 w-9 rounded-xl" />
                        <div className="hidden min-w-0 flex-1 sm:block">
                            <HeaderSkeletonBlock className="h-3 w-24" />
                            <HeaderSkeletonBlock className="mt-2 h-3 w-20" />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
