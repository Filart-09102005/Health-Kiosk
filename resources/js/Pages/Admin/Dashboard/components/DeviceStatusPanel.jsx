import { deviceStatuses } from "../data/demoData";
import { cardClassName, cardStyle } from "../utils/surface";
import DeviceStatusCard from "./DeviceStatusCard";
import SectionHeader from "./SectionHeader";

export default function DeviceStatusPanel() {
    return (
        <article className={`${cardClassName} p-5`} style={cardStyle}>
            <SectionHeader
                title="Device status"
                description="Live hardware connectivity for kiosk sensors and controllers."
            />
            <div className="grid gap-3 sm:grid-cols-2">
                {deviceStatuses.map((device) => (
                    <DeviceStatusCard key={device.id} device={device} />
                ))}
            </div>
        </article>
    );
}
