export default function AlertTypeBadge({ type }) {
    return (
        <span className="inline-flex rounded-full border px-3 py-1 text-xs font-black" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
            {type}
        </span>
    );
}
