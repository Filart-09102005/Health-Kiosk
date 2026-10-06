import { useState } from "react";
import { HeartPulse, ScanBarcode, ShieldCheck, Sparkles } from "lucide-react";
import ThemeToggle from "../../Global/ThemeToggle";
import Appearance from "../../User/Drawers/Appearance";

export default function AuthLayout({
    children,
    eyebrow,
    title,
    subtitle,
    panelTitle,
    panelDescription,
    variant = "login",
}) {
    const loginPanel = variant === "login";
    // The quick toggle only cycles System/Light/Dark - the full picker with
    // all the named themes lives in this same Appearance drawer used
    // everywhere else, so it's opened here instead of built twice.
    const [appearanceOpen, setAppearanceOpen] = useState(false);

    return (
        <main className="auth-screen h-screen overflow-hidden px-5 py-6">
            <div className="fixed right-6 top-6 z-30">
                <ThemeToggle onClick={() => setAppearanceOpen(true)} />
            </div>

            <Appearance open={appearanceOpen} onClose={() => setAppearanceOpen(false)} />

            <section className="relative z-10 mx-auto grid h-[calc(100vh-3rem)] w-full max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="auth-brand-panel flex min-h-[640px] flex-col justify-between py-10 lg:pl-10">
                    <BrandLockup caption={loginPanel ? "Student Health Monitoring" : "Health Monitoring System"} />

                    <div className="mx-auto w-full max-w-md text-center">
                        <h1 className="text-3xl font-black leading-tight auth-strong-text md:text-4xl">
                            {panelTitle}
                        </h1>
                        <p className="mx-auto mt-5 max-w-sm text-base font-semibold leading-8 auth-muted-text">
                            {panelDescription}
                        </p>

                        {loginPanel ? <SecurityStats /> : <RegisterPills />}
                    </div>
                </div>

                <div className="hk-auth-form-scroll mx-auto max-h-[calc(100vh-4.5rem)] w-full max-w-[450px] overflow-y-auto overscroll-contain py-10 pr-1">
                    <p className="auth-eyebrow" style={{ color: variant === "register" ? "#22d3ee" : "var(--color-primary)" }}>
                        {eyebrow}
                    </p>
                    <h2 className="mt-2 text-3xl font-black tracking-normal auth-strong-text md:text-4xl">
                        {title}
                    </h2>
                    {subtitle ? (
                        <p className="mt-3 text-base font-semibold leading-6 auth-muted-text">
                            {subtitle}
                        </p>
                    ) : null}

                    {children}
                </div>
            </section>
        </main>
    );
}

function BrandLockup({ caption }) {
    return (
        <div className="mx-auto flex w-full max-w-md items-center gap-4">
            <div className="auth-logo">
                <HeartPulse size={28} />
            </div>
            <div>
                <div className="text-2xl font-black leading-none auth-strong-text">
                    Health<span style={{ color: "var(--color-primary)" }}>Kiosk</span>
                </div>
                <div className="mt-2 text-xs font-black uppercase tracking-[0.24em] auth-muted-text">
                    {caption}
                </div>
            </div>
        </div>
    );
}

function SecurityStats() {
    return (
        <>
            <div className="mx-auto mt-10 grid max-w-sm grid-cols-3 overflow-hidden rounded-2xl border auth-panel">
                <Stat label="Auth Method" value="Barcode" />
                <Stat label="Encryption" value="256-bit" />
                <Stat label="Status" value="Online" success />
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
                <StatusPill color="var(--color-success)" label="Ready to Scan" />
                <StatusPill color="var(--color-primary)" label="Secure Auth" />
                <StatusPill color="#818cf8" label="Barcode Ready" />
            </div>
        </>
    );
}

function RegisterPills() {
    return (
        <div className="mt-8 flex flex-wrap justify-center gap-2">
            <StatusPill icon={ShieldCheck} color="var(--color-primary)" label="Secure" />
            <StatusPill icon={ScanBarcode} color="var(--color-primary)" label="Barcode Ready" />
            <StatusPill icon={Sparkles} color="#38bdf8" label="Health Tracking" />
        </div>
    );
}

function Stat({ label, value, success = false }) {
    return (
        <div className="border-r px-4 py-4 last:border-r-0" style={{ borderColor: "var(--auth-border)" }}>
            <div className="text-lg font-black" style={{ color: success ? "var(--color-success)" : "var(--auth-text)" }}>
                {value}
            </div>
            <div className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.16em] auth-muted-text">
                {label}
            </div>
        </div>
    );
}

function StatusPill({ icon: Icon, color, label }) {
    return (
        <div className="flex items-center gap-2 rounded-full border auth-panel px-4 py-2 text-xs font-black auth-muted-text">
            {Icon ? <Icon size={14} style={{ color }} /> : <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />}
            {label}
        </div>
    );
}
