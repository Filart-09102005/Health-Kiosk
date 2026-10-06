import SectionHeader from "./SectionHeader";

const cells = [1, 2, 1, 3, 4, 2, 5, 3, 2, 1, 4, 5, 2, 3, 1, 2, 4, 3, 5, 2, 1, 3, 2, 4, 5, 3, 2, 1];

export default function AlertHeatmapChart() {
    return (
        <div className="rounded-[1.25rem] border p-5" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <SectionHeader title="Alert heatmap" description="Peak alert windows across kiosk activity." />
            <div className="mt-5 grid grid-cols-7 gap-2">
                {cells.map((level, index) => (
                    <div
                        key={index}
                        className="h-8 rounded-[8px] border"
                        style={{
                            borderColor: "var(--color-border)",
                            backgroundColor: `color-mix(in srgb, var(--color-primary) ${level * 14}%, var(--color-surface))`,
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
