import { motion } from "framer-motion";

export default function RecordTimeline({ events = [] }) {
    return (
        <ol className="relative space-y-0">
            {events.map((event, index) => (
                <motion.li
                    key={`${event.time}-${event.label}`}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="relative flex gap-4 pb-6 last:pb-0"
                >
                    <div className="flex flex-col items-center">
                        <span className="z-10 flex h-3 w-3 rounded-full ring-4" style={{ backgroundColor: "var(--color-primary)", boxShadow: "0 0 0 4px color-mix(in srgb, var(--color-primary) 18%, transparent)" }} />
                        {index < events.length - 1 ? (
                            <span className="mt-1 w-px flex-1" style={{ backgroundColor: "var(--color-border)", minHeight: "2.5rem" }} />
                        ) : null}
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-black" style={{ color: "var(--color-primary)" }}>{event.time}</p>
                            <p className="text-sm font-black">{event.label}</p>
                        </div>
                        <p className="mt-1 text-xs leading-5" style={{ color: "var(--color-muted)" }}>
                            {event.detail}
                        </p>
                    </div>
                </motion.li>
            ))}
        </ol>
    );
}
