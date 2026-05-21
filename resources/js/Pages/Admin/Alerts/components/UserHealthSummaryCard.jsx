export default function UserHealthSummaryCard({ alert }) {
    return (
        <div className="rounded-[14px] border p-4" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <p className="font-black">User health summary</p>
            <p className="mt-2 text-sm font-bold" style={{ color: "var(--color-muted)" }}>{alert.fullName} - {alert.role} - {alert.department}</p>
            <p className="mt-3 rounded-[12px] p-3 text-sm font-bold leading-6" style={{ backgroundColor: "var(--color-surface)" }}>{alert.advice}</p>
        </div>
    );
}
