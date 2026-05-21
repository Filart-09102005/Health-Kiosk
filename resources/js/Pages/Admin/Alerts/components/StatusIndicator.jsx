export default function StatusIndicator({ tone = "var(--color-success)", pulse = false }) {
    return (
        <span className="relative flex h-2.5 w-2.5">
            {pulse ? <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50" style={{ backgroundColor: tone }} /> : null}
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tone }} />
        </span>
    );
}
