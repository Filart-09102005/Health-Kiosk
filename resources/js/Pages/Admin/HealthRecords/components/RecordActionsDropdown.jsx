import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Eye } from "lucide-react";

export default function RecordActionsDropdown({ record, onViewDetails }) {
    const [tooltip, setTooltip] = useState(null);

    const showTooltip = (event, label) => {
        const rect = event.currentTarget.getBoundingClientRect();

        setTooltip({
            label,
            top: rect.top - 10,
            left: rect.left + rect.width / 2,
        });
    };

    const hideTooltip = () => setTooltip(null);

    return (
        <>
            <div className="flex items-center gap-2">
                <ActionIconButton
                    label="View records"
                    icon={Eye}
                    onClick={() => onViewDetails(record)}
                    onShowTooltip={showTooltip}
                    onHideTooltip={hideTooltip}
                />
            </div>
            {typeof document === "undefined" || !tooltip ? null : createPortal(
                <div
                    className="pointer-events-none fixed z-[300] -translate-x-1/2 -translate-y-full rounded-lg border px-3 py-2 text-[0.68rem] font-black shadow-xl backdrop-blur-xl"
                    style={{
                        top: tooltip.top,
                        left: tooltip.left,
                        backgroundColor: "color-mix(in srgb, var(--color-card) 96%, transparent)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-text)",
                    }}
                >
                    {tooltip.label}
                </div>,
                document.body,
            )}
        </>
    );
}

function ActionIconButton({ label, icon: Icon, onClick, onShowTooltip, onHideTooltip }) {
    const buttonRef = useRef(null);

    return (
        <button
            ref={buttonRef}
            type="button"
            onClick={onClick}
            onMouseEnter={(event) => onShowTooltip(event, label)}
            onMouseLeave={onHideTooltip}
            onFocus={(event) => onShowTooltip(event, label)}
            onBlur={onHideTooltip}
            className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-black transition hk-soft-hover focus:outline-none focus-visible:ring-2"
            style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
                color: "var(--color-text)",
                "--tw-ring-color": "var(--color-primary)",
            }}
            aria-label={label}
        >
            <Icon size={16} />
            <span className="whitespace-nowrap">{label}</span>
        </button>
    );
}
