export default function StatusFilter() {
    return (
        <select className="h-11 rounded-[12px] border bg-transparent px-3 text-sm font-black outline-none" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            {["Status", "Pending", "Reviewed", "Resolved", "Escalated"].map((item) => <option key={item}>{item}</option>)}
        </select>
    );
}
