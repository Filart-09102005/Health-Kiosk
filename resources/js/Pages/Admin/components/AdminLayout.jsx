import Header from "./Header";
import Sidebar from "./Sidebar";
import { useToast } from "../../Global/Toast";
import { authService } from "../../Auth/services/authService";

export default function AdminLayout({
    navigate,
    pathname,
    eyebrow = "Admin Console",
    title = "Health Kiosk Admin",
    children,
}) {
    const { showToast } = useToast();

    const logout = async () => {
        await authService.logout();
        showToast({ type: "info", title: "Logged out", message: "Your admin session has ended." });
        navigate("/login");
    };

    return (
        <main className="hk-page min-h-screen lg:flex" style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
            <Sidebar navigate={navigate} pathname={pathname} />

            <section className="min-w-0 flex-1 px-4 py-6 lg:px-6">
                <div className="mx-auto max-w-[90rem]">
                    <Header onLogout={logout} eyebrow={eyebrow} title={title} />
                    {children}
                </div>
            </section>
        </main>
    );
}
