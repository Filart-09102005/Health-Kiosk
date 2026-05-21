export default function HealthStatusFilter() {
    return (
        <select className="rounded-[12px] border px-4 py-3 text-sm font-black outline-none" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-text)" }}>
            <option>All health statuses</option>
            <option>Normal</option>
            <option>Watch</option>
            <option>Alert</option>
            <option>Incomplete</option>
        </select>
    );
}
