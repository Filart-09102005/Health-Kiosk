import { CalendarClock } from "lucide-react";
import SectionHeader from "./SectionHeader";

const schedules = ["Weekly Clinic Summary", "Monthly Health Analytics", "Daily Alert Monitoring"];

export default function ScheduledReportsCard() {
    return (
        <section className="rounded-[14px] border p-5 shadow-xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <SectionHeader eyebrow="Schedule" title="Scheduled reports" description="Automated demo report jobs." />
            <div className="mt-4 space-y-3">
                {schedules.map((schedule) => (
                    <div key={schedule} className="flex items-center gap-3 rounded-[12px] border p-3" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                        <CalendarClock size={17} style={{ color: "var(--color-primary)" }} />
                        <div>
                            <p className="text-sm font-black">{schedule}</p>
                            <p className="text-xs font-bold" style={{ color: "var(--color-muted)" }}>Next run configured</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
