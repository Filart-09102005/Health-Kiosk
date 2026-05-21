import { Cpu, Wifi } from "lucide-react";
import StatusBadge from "./StatusBadge";

const statusGlow = {
    online: "var(--color-success)",
    offline: "var(--color-error)",
    warning: "var(--color-primary)",
};

export default function DeviceStatusCard({ device }) {
    const glow = statusGlow[device.status] || "var(--color-muted)";

    return (
        <article
            className="rounded-2xl border p-4 transition hk-soft-hover"
            style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
                boxShadow: `0 0 0 1px color-mix(in srgb, ${glow} 18%, transparent)`,
            }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span
                        className="relative flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, var(--color-surface))", color: "var(--color-primary)" }}
                    >
                        {device.name.includes("Internet") ? <Wifi size={18} /> : <Cpu size={18} />}
                        <span
                            className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: glow, boxShadow: `0 0 10px ${glow}` }}
                        />
                    </span>
                    <div>
                        <p className="text-sm font-black">{device.name}</p>
                        <p className="mt-1 text-xs capitalize" style={{ color: "var(--color-muted)" }}>
                            Hardware module
                        </p>
                    </div>
                </div>
                <StatusBadge label={device.status} />
            </div>
        </article>
    );
}
