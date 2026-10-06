

export default function AlertActionsDropdown({ onView }) {
    return (
        <div className="flex items-center gap-2">
            <button onClick={onView} className="rounded-[0.875rem] border px-3 py-2 text-xs font-black transition hk-admin-nav-hover" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                View Details
            </button>
        </div>
    );
}
