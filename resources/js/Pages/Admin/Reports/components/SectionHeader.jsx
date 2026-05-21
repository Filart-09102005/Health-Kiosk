export default function SectionHeader({ eyebrow, title, description }) {
    return (
        <div>
            {eyebrow ? <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-muted)" }}>{eyebrow}</p> : null}
            <h3 className="mt-1 text-xl font-black">{title}</h3>
            {description ? <p className="mt-1 text-sm leading-6" style={{ color: "var(--color-muted)" }}>{description}</p> : null}
        </div>
    );
}
