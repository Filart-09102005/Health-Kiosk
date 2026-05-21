import AlertPriorityCard from "./AlertPriorityCard";
import SectionHeader from "./SectionHeader";

const insights = [
    ["Most common alert", "Temperature", "42% of abnormal kiosk readings"],
    ["Highest temperature", "38.9 C", "Recorded during morning check-in"],
    ["Lowest SpO2", "92%", "Repeat scan recommended"],
    ["Most active day", "Tuesday", "Peak clinic monitoring traffic"],
    ["Fastest response", "1m 48s", "Reviewed by clinic admin"],
    ["Unresolved category", "Temperature", "Needs same-day follow up"],
];

export default function AlertInsightsPanel() {
    return (
        <section className="rounded-[14px] border p-5 shadow-xl" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <SectionHeader eyebrow="Insights" title="Clinic alert insights" description="Operational highlights for triage, response, and unresolved risks." />
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {insights.map(([label, value, detail]) => (
                    <AlertPriorityCard key={label} label={label} value={value} detail={detail} />
                ))}
            </div>
        </section>
    );
}
