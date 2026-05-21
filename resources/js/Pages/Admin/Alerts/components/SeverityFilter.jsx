export default function SeverityFilter() {
    return (
        <select className="h-11 rounded-[12px] border bg-transparent px-3 text-sm font-black outline-none" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            {["Severity", "Low", "Medium", "High", "Critical"].map((item) => <option key={item}>{item}</option>)}
        </select>
    );
}
