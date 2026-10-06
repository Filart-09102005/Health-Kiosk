export default function MiniAnalyticsCard({ title, value, caption }) {
    return (
        <div className="rounded-[1.25rem] border p-4 hk-admin-card" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--color-muted)" }}>{title}</p>
            <p className="mt-2 text-2xl font-black">{value}</p>
            <p className="mt-2 text-sm font-bold leading-6" style={{ color: "var(--color-muted)" }}>{caption}</p>
        </div>
    );
}
