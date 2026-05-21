import { Building2, Mail, ShieldCheck, UserCog } from "lucide-react";
import AdminShell from "../components/AdminShell";
import AdminModulePage from "../components/AdminModulePage";

export default function Profile({ navigate }) {
    return (
        <AdminShell navigate={navigate} eyebrow="Account" title="Admin Profile">
            <AdminModulePage
                icon={UserCog}
                eyebrow="Account profile"
                title="Profile"
                description="Review administrator identity, role, contact email, and clinic assignment."
                stats={[
                    { label: "Role", value: "Admin", caption: "Full system access", icon: ShieldCheck },
                    { label: "Department", value: "Clinic", caption: "Assigned area", icon: Building2 },
                    { label: "Email", value: "Verified", caption: "smcbihealthkiosk@gmail.com", icon: Mail },
                    { label: "Security", value: "Active", caption: "Session protected", icon: UserCog },
                ]}
            >
                <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
                    <article className="rounded-[14px] border p-5" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                        <div className="flex h-16 w-16 items-center justify-center rounded-[14px] text-xl font-black" style={{ backgroundColor: "var(--color-text)", color: "var(--color-bg)" }}>
                            HK
                        </div>
                        <h3 className="mt-5 text-2xl font-black">Health Kiosk</h3>
                        <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>System administrator</p>
                        <p className="mt-5 rounded-[12px] p-4 text-sm font-bold leading-6" style={{ backgroundColor: "var(--color-surface)" }}>
                            This profile is used for admin access, kiosk monitoring, reports, and audit actions.
                        </p>
                    </article>

                    <article className="rounded-[14px] border p-5" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                        <h3 className="text-lg font-black">Profile details</h3>
                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                            {[
                                ["Firstname", "Health"],
                                ["Lastname", "Kiosk"],
                                ["Email", "smcbihealthkiosk@gmail.com"],
                                ["Department", "Clinic"],
                            ].map(([label, value]) => (
                                <div key={label} className="rounded-[12px] border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                                    <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--color-muted)" }}>{label}</p>
                                    <p className="mt-2 font-black">{value}</p>
                                </div>
                            ))}
                        </div>
                    </article>
                </section>
            </AdminModulePage>
        </AdminShell>
    );
}
