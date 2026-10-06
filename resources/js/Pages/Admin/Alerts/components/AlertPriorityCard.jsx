export default function AlertPriorityCard({ label, value, detail }) {
    return (
        <div className="rounded-[1.25rem] border p-4 transition hk-admin-nav-hover" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--color-muted)" }}>{label}</p>
            <p className="mt-2 text-2xl font-black">{value}</p>
            <p className="mt-2 text-sm font-bold" style={{ color: "var(--color-muted)" }}>{detail}</p>
        </div>
    );
}
