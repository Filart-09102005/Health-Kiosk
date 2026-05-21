import { BatteryCharging, HeartPulse, RadioTower, Scale, Thermometer } from "lucide-react";
import AdminShell from "../components/AdminShell";
import AdminModulePage from "../components/AdminModulePage";

const rows = [
    { id: 1, Device: "Pulse Oximeter", Type: "Heart Rate / SpO2", State: "Online", Battery: "92%", Updated: "1 min ago" },
    { id: 2, Device: "IR Thermometer", Type: "Temperature", State: "Online", Battery: "88%", Updated: "2 min ago" },
    { id: 3, Device: "Load Cell Platform", Type: "Weight", State: "Maintenance", Battery: "Wired", Updated: "Today, 7:30 AM" },
];

export default function Devices({ navigate }) {
    return (
        <AdminShell navigate={navigate} eyebrow="Devices and Sensors" title="Kiosk Hardware">
            <AdminModulePage
                icon={RadioTower}
                eyebrow="Device status"
                title="Devices & Sensors"
                description="Monitor kiosk hardware availability, last signal time, maintenance state, and sensor readiness."
                stats={[
                    { label: "Online", value: "5", caption: "Reachable devices", icon: RadioTower },
                    { label: "Oximeter", value: "Ready", caption: "Pulse and SpO2", icon: HeartPulse },
                    { label: "Thermal", value: "Ready", caption: "IR sensor", icon: Thermometer },
                    { label: "Scale", value: "Check", caption: "Maintenance note", icon: Scale },
                ]}
                columns={["Device", "Type", "State", "Battery", "Updated"]}
                rows={rows}
            >
                <div className="rounded-[14px] border p-5" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                    <div className="flex items-center gap-3">
                        <BatteryCharging size={20} style={{ color: "var(--color-success)" }} />
                        <p className="font-black">Hardware heartbeat is being monitored every few minutes.</p>
                    </div>
                </div>
            </AdminModulePage>
        </AdminShell>
    );
}
