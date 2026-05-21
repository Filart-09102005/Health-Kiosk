export default function SectionHeader({ title, description, action = null }) {
    return (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
                <h2 className="text-lg font-black sm:text-xl">{title}</h2>
                {description ? <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>{description}</p> : null}
            </div>
            {action}
        </div>
    );
}
