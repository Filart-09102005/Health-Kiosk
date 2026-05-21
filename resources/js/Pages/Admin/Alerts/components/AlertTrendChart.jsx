import SectionHeader from "./SectionHeader";

const points = [18, 25, 21, 34, 29, 42, 31];

export default function AlertTrendChart() {
    return (
        <div className="rounded-[14px] border p-5" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <SectionHeader title="Alert trend" description="Seven-day monitoring pattern." />
            <div className="mt-6 flex h-36 items-end gap-2">
                {points.map((point, index) => (
                    <div key={index} className="flex flex-1 flex-col items-center gap-2">
                        <div className="w-full rounded-t-[10px]" style={{ height: `${point * 2.4}px`, backgroundColor: "color-mix(in srgb, var(--color-primary) 72%, transparent)" }} />
                        <span className="text-[10px] font-black" style={{ color: "var(--color-muted)" }}>D{index + 1}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
