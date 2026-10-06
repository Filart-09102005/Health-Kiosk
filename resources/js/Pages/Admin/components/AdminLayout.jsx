import { useEffect, useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import GlobalAlertModal from "./GlobalAlertModal";
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
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    // Below the desktop breakpoint the sidebar is a drawer over the page
    // rather than a column beside it, so it has to close itself once a link
    // in it has actually navigated somewhere - otherwise it would still be
    // covering the new page.
    useEffect(() => {
        setMobileNavOpen(false);
    }, [pathname]);

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
        <main className="hk-page min-h-screen lg:flex lg:h-screen lg:overflow-hidden" style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
            <Sidebar
                navigate={navigate}
                pathname={pathname}
                mobileOpen={mobileNavOpen}
                onCloseMobile={() => setMobileNavOpen(false)}
            />

            <section className="relative z-[1] min-w-0 flex-1 px-3 py-4 sm:px-4 sm:py-6 lg:h-screen lg:overflow-y-auto lg:pl-0 lg:pr-6">
                <div className="mx-auto max-w-[90rem]">
                    {loadingHeader ? (
                        <AdminHeaderSkeleton />
                    ) : (
                        <Header
                            onLogout={logout}
                            eyebrow={eyebrow}
                            title={title}
                            onOpenMobileNav={() => setMobileNavOpen(true)}
                        />
                    )}
                    {children}
                </div>
            </section>

            <GlobalAlertModal navigate={navigate} />
        </main>
    );
}

function HeaderSkeletonBlock({ className = "" }) {
    return <div className={`hk-skeleton-shimmer rounded-xl ${className}`} aria-hidden="true" />;
}

function AdminHeaderSkeleton() {
    return (
        <header
            className="sticky top-0 z-20 mb-2 rounded-[2rem] border px-4 py-3 sm:px-6 sm:py-4 shadow-xl backdrop-blur-xl transition-all"
            style={{
                backgroundColor: "color-mix(in srgb, var(--color-card) 35%, transparent)",
                borderColor: "color-mix(in srgb, var(--color-border) 20%, transparent)",
            }}
            aria-busy="true"
            aria-label="Loading admin header"
        >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                    <HeaderSkeletonBlock className="h-12 w-12 shrink-0 rounded-[1.15rem]" />
                    <div className="flex flex-col justify-center gap-2">
                        <HeaderSkeletonBlock className="h-3 w-24" />
                        <HeaderSkeletonBlock className="h-6 w-64 max-w-full" />
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                    <div 
                        className="flex items-center gap-1.5 rounded-[1.25rem] border p-1.5"
                        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                    >
                        <HeaderSkeletonBlock className="h-9 w-9 rounded-xl" />
                        <div className="h-6 w-px mx-1" style={{ backgroundColor: "var(--color-border)" }} />
                        <HeaderSkeletonBlock className="h-10 w-10 rounded-[1rem]" />
                    </div>

                    <div
                        className="flex items-center gap-3 rounded-[1.25rem] border p-1.5 pr-4"
                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                    >
                        <HeaderSkeletonBlock className="h-10 w-10 rounded-[1rem]" />
                        <div className="hidden min-w-0 flex-1 sm:block space-y-2">
                            <HeaderSkeletonBlock className="h-3 w-24" />
                            <HeaderSkeletonBlock className="h-2 w-16" />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
