import { Radio } from "lucide-react";
import StatusBadge from "./StatusBadge";

export default function ActiveSessionCard({ session }) {
    return (
        <article
            className="rounded-2xl border p-4 transition hk-soft-hover"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-black uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
                        School ID
                    </p>
                    <p className="mt-1 text-sm font-black">{session.schoolId}</p>
                </div>
                <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ backgroundColor: "var(--color-success)" }} />
                    <span className="relative inline-flex h-3 w-3 rounded-full" style={{ backgroundColor: "var(--color-success)" }} />
                </span>
            </div>
            <div className="mt-4 grid gap-3 text-sm">
                <div>
                    <p className="text-xs font-black uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>Current measurement</p>
                    <p className="mt-1 font-black">{session.measurement}</p>
                </div>
                <div>
                    <p className="text-xs font-black uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>Session duration</p>
                    <p className="mt-1 font-semibold" style={{ color: "var(--color-muted)" }}>{session.duration}</p>
                </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
                <StatusBadge label={session.status} />
                <span className="inline-flex items-center gap-1 text-xs font-black" style={{ color: "var(--color-primary)" }}>
                    <Radio size={14} />
                    Live
                </span>
            </div>
        </article>
    );
}
