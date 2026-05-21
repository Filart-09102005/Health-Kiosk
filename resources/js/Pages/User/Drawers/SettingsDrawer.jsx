import { useState } from "react";
import DrawerShell from "../../Global/DrawerShell";

function Toggle({ checked, onChange }) {
    return (
        <button
            type="button"
            onClick={() => onChange(! checked)}
            className="relative h-7 w-12 rounded-full border transition"
            style={{
                backgroundColor: checked ? "var(--color-primary)" : "var(--color-surface)",
                borderColor: "var(--color-border)",
            }}
            aria-pressed={checked}
        >
            <span
                className="absolute top-1 h-5 w-5 rounded-full transition"
                style={{
                    left: checked ? "1.55rem" : "0.25rem",
                    backgroundColor: "var(--color-card)",
                    boxShadow: "0 8px 20px color-mix(in srgb, var(--color-text) 14%, transparent)",
                }}
            />
        </button>
    );
}

export default function SettingsDrawer({ open, onClose }) {
    const [settings, setSettings] = useState({
        notifications: true,
        sounds: true,
        autoNext: true,
        largeReadings: true,
    });

    const update = (key, value) => setSettings((current) => ({ ...current, [key]: value }));

    const groups = [
        {
            title: "Notifications",
            items: [
                ["notifications", "Clinic alerts", "Show reminders and measurement alerts."],
                ["sounds", "Kiosk sounds", "Play soft feedback sounds during the flow."],
            ],
        },
        {
            title: "Measurement preferences",
            items: [
                ["autoNext", "Auto-advance steps", "Move to the next reading when a sensor completes."],
                ["largeReadings", "Large reading display", "Use larger numbers for touch-screen visibility."],
            ],
        },
    ];

    return (
        <DrawerShell
            open={open}
            onClose={onClose}
            title="Settings"
            description="Adjust kiosk behavior for guided health checks."
            footer={
                <button
                    type="button"
                    onClick={onClose}
                    className="w-full rounded-2xl px-4 py-3 text-sm font-black text-white transition hk-primary-hover"
                    style={{ backgroundColor: "var(--color-primary)" }}
                >
                    Save settings
                </button>
            }
        >
            <div className="space-y-5">
                {groups.map((group) => (
                    <section key={group.title} className="rounded-3xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
                        <h3 className="font-black">{group.title}</h3>
                        <div className="mt-4 space-y-4">
                            {group.items.map(([key, label, description]) => (
                                <div key={key} className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-black">{label}</p>
                                        <p className="mt-1 text-xs leading-5" style={{ color: "var(--color-muted)" }}>
                                            {description}
                                        </p>
                                    </div>
                                    <Toggle checked={settings[key]} onChange={(value) => update(key, value)} />
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </DrawerShell>
    );
}
