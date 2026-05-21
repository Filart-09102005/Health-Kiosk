import SectionHeader from "./SectionHeader";

const values = [34, 42, 39, 58, 64, 71, 68, 82];

export default function MeasurementTrendChart() {
    return (
        <div className="rounded-[14px] border p-5" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <SectionHeader title="Measurement trend" description="Daily reportable kiosk measurements." />
            <div className="mt-6 flex h-36 items-end gap-2">
                {values.map((value, index) => (
                    <div key={index} className="flex flex-1 flex-col items-center gap-2">
                        <div className="w-full rounded-t-[10px]" style={{ height: `${value}%`, backgroundColor: "color-mix(in srgb, var(--color-primary) 72%, transparent)" }} />
                        <span className="text-[10px] font-black" style={{ color: "var(--color-muted)" }}>{index + 1}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
