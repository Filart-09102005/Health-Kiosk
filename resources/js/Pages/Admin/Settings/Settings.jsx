import { Bell, Database, LockKeyhole, Settings as SettingsIcon, SlidersHorizontal } from "lucide-react";
import AdminShell from "../components/AdminShell";
import AdminModulePage from "../components/AdminModulePage";

const settings = [
    { title: "Email verification", description: "Require verified school email before kiosk access.", enabled: true, icon: LockKeyhole },
    { title: "Clinic notifications", description: "Notify clinic staff for Watch and Alert readings.", enabled: true, icon: Bell },
    { title: "Session timeout", description: "Automatically end idle kiosk sessions.", enabled: true, icon: SlidersHorizontal },
    { title: "Dashboard caching", description: "Cache counts and repeated admin dashboard values.", enabled: true, icon: Database },
];

export default function Settings({ navigate }) {
    return (
        <AdminShell navigate={navigate} eyebrow="System Settings" title="Admin Settings">
            <AdminModulePage
                icon={SettingsIcon}
                eyebrow="Configuration"
                title="Settings"
                description="Manage safe defaults for kiosk access, notifications, sessions, performance, and admin preferences."
                stats={[
                    { label: "Security", value: "Strict", caption: "Recommended mode", icon: LockKeyhole },
                    { label: "Notifications", value: "On", caption: "Clinic alerts", icon: Bell },
                    { label: "Timeout", value: "15m", caption: "Idle sessions", icon: SlidersHorizontal },
                    { label: "Cache", value: "Active", caption: "Fast dashboards", icon: Database },
                ]}
            >
                <section className="grid gap-4 md:grid-cols-2">
                    {settings.map((setting) => {
                        const Icon = setting.icon;

                        return (
                            <article key={setting.title} className="rounded-[14px] border p-5" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-[10px]" style={{ backgroundColor: "var(--color-surface)" }}>
                                            <Icon size={19} />
                                        </div>
                                        <div>
                                            <p className="font-black">{setting.title}</p>
                                            <p className="mt-1 text-sm leading-6" style={{ color: "var(--color-muted)" }}>{setting.description}</p>
                                        </div>
                                    </div>
                                    <span className="rounded-full px-3 py-1 text-xs font-black" style={{ color: "var(--color-success)", backgroundColor: "color-mix(in srgb, currentColor 10%, transparent)" }}>
                                        On
                                    </span>
                                </div>
                            </article>
                        );
                    })}
                </section>
            </AdminModulePage>
        </AdminShell>
    );
}
