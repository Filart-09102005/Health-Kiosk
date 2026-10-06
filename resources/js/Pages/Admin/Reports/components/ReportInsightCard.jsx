export default function ReportInsightCard({ label, value }) {
    return (
        <div className="rounded-[1rem] border p-3" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <p className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--color-muted)" }}>{label}</p>
            <p className="mt-1 text-xl font-black">{value}</p>
        </div>
    );
}
