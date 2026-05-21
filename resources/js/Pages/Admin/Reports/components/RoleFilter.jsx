export default function RoleFilter() {
    return (
        <select className="rounded-[12px] border px-4 py-3 text-sm font-black outline-none" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-text)" }}>
            <option>All roles</option>
            <option>Students</option>
            <option>Teachers</option>
        </select>
    );
}
