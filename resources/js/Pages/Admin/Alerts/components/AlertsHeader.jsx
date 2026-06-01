import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";

export default function AlertsHeader({ alertsEnabled = true, sensitivityProfile }) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[14px] border p-5 shadow-xl"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px]" style={{ backgroundColor: "var(--color-surface)", color: "var(--color-error)" }}>
                        <ShieldAlert size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-muted)" }}>Admin / Monitoring / Health Alerts</p>
                        <h2 className="mt-2 text-3xl font-black">Health Alerts Command Center</h2>
                        <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: "var(--color-muted)" }}>
                            Monitoring abnormal readings, critical kiosk alerts, response timing, and clinic review workflows using the active sensitivity setting.
                        </p>
                    </div>
                </div>
                <div className="rounded-[12px] border p-4 text-sm font-bold" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                    <p>
                        Alert engine status: <span style={{ color: alertsEnabled ? "var(--color-success)" : "var(--color-error)" }}>{alertsEnabled ? "Monitoring" : "Paused"}</span>
                    </p>
                    {sensitivityProfile ? (
                        <p className="mt-2 text-xs leading-5" style={{ color: "var(--color-muted)" }}>
                            {sensitivityProfile.label} sensitivity - {alertsEnabled ? `${sensitivityProfile.queueRate}% detection, ${sensitivityProfile.delayLabel.toLowerCase()}` : "alerts disabled"}
                        </p>
                    ) : null}
                </div>
            </div>
        </motion.section>
    );
}
