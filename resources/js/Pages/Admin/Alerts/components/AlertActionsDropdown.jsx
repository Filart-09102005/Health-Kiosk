import { MoreHorizontal } from "lucide-react";

export default function AlertActionsDropdown({ onView }) {
    return (
        <div className="flex items-center gap-2">
            <button onClick={onView} className="rounded-[10px] border px-3 py-2 text-xs font-black transition hk-admin-nav-hover" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                View Details
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-[10px] border transition hk-admin-nav-hover" style={{ borderColor: "var(--color-border)" }}>
                <MoreHorizontal size={16} />
            </button>
        </div>
    );
}
