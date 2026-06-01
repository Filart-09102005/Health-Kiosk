import { Check } from "lucide-react";
import { motion } from "framer-motion";

function StudentAnimation({ isActive }) {
    return (
        <motion.svg
            viewBox="0 0 100 100"
            className="w-14 h-14 drop-shadow-sm"
            initial="idle"
            animate={isActive ? "active" : "idle"}
            variants={{
                idle: { scale: 1 },
                active: { scale: 1.08 }
            }}
        >
            <motion.path
                d="M50 25 L80 40 L50 55 L20 40 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinejoin="round"
                variants={{
                    idle: { y: 0, opacity: 0.7 },
                    active: { y: [0, -4, 0], opacity: 1, transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } }
                }}
            />
            <motion.path
                d="M30 45 L30 70 Q50 80 70 70 L70 45"
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                variants={{
                    idle: { pathLength: 1, opacity: 0.7 },
                    active: { pathLength: [0, 1], opacity: 1, transition: { duration: 1, ease: "easeOut" } }
                }}
            />
            <motion.circle 
                cx="80" cy="50" r="3.5" fill="currentColor"
                variants={{
                    idle: { opacity: 0.5 },
                    active: { opacity: 1, y: [0, 4, 0], transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } }
                }}
            />
            <motion.path d="M80 50 L80 65" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        </motion.svg>
    );
}

function TeacherAnimation({ isActive }) {
    return (
        <motion.svg
            viewBox="0 0 100 100"
            className="w-14 h-14 drop-shadow-sm"
            initial="idle"
            animate={isActive ? "active" : "idle"}
            variants={{
                idle: { scale: 1 },
                active: { scale: 1.08 }
            }}
        >
            <motion.circle
                cx="45" cy="35" r="14"
                fill="none" stroke="currentColor" strokeWidth="5"
                variants={{
                    idle: { y: 0, opacity: 0.7 },
                    active: { y: [0, -3, 0], opacity: 1, transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } }
                }}
            />
            <motion.path
                d="M20 80 Q45 55 70 80"
                fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round"
                variants={{
                    idle: { pathLength: 1, opacity: 0.7 },
                    active: { pathLength: [0, 1], opacity: 1, transition: { duration: 1, ease: "easeOut" } }
                }}
            />
            <motion.path
                d="M65 30 L85 30 M65 42 L95 42 M65 54 L80 54"
                stroke="currentColor" strokeWidth="5" strokeLinecap="round"
                variants={{
                    idle: { opacity: 0.4, x: 0 },
                    active: { opacity: 1, x: [10, 0], transition: { duration: 0.8, ease: "easeOut" } }
                }}
            />
        </motion.svg>
    );
}

const roles = [
    {
        value: "student",
        title: "STUDENT",
        description: "For learners using the kiosk for health measurements.",
        Animation: StudentAnimation,
    },
    {
        value: "teacher",
        title: "TEACHER",
        description: "For faculty and staff health kiosk access.",
        Animation: TeacherAnimation,
    },
];

export default function RoleSelector({ value, onChange }) {
    return (
        <div className="grid gap-5 md:grid-cols-2">
            {roles.map((role) => {
                const isSelected = value === role.value;

                return (
                    <motion.button
                        key={role.value}
                        type="button"
                        onClick={() => onChange(role.value)}
                        className="group relative rounded-[1.5rem] border p-6 text-left transition-all duration-300 overflow-hidden"
                        whileHover={{ y: -4, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            backgroundColor: isSelected ? "color-mix(in srgb, var(--color-primary), transparent 94%)" : "var(--auth-panel)",
                            borderColor: isSelected ? "var(--color-primary)" : "var(--auth-border)",
                            color: "var(--auth-text)",
                            boxShadow: isSelected ? "0 12px 40px rgba(37,99,235,0.12)" : "none"
                        }}
                    >
                        {isSelected && (
                            <motion.div 
                                layoutId="activeRoleCheck"
                                className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-white shadow-md z-10" 
                                style={{ backgroundColor: "var(--color-primary)" }}
                                initial={{ scale: 0, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            >
                                <Check size={18} strokeWidth={3} />
                            </motion.div>
                        )}
                        
                        <div className="flex flex-col items-center text-center gap-5">
                            <div
                                className="flex h-24 w-24 items-center justify-center rounded-[1.25rem] transition-colors duration-500 relative"
                                style={{
                                    backgroundColor: isSelected ? "color-mix(in srgb, var(--color-primary), transparent 84%)" : "var(--auth-control)",
                                    color: isSelected ? "var(--color-primary)" : "var(--color-muted)",
                                }}
                            >
                                {isSelected && (
                                    <motion.div 
                                        className="absolute inset-0 rounded-[1.25rem]"
                                        style={{ border: "2px solid var(--color-primary)" }}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 0.35, scale: 1.15 }}
                                        transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                                    />
                                )}
                                <role.Animation isActive={isSelected} />
                            </div>
                            <div>
                                <h3 className="text-[1.15rem] font-black tracking-widest text-transparent bg-clip-text" style={{
                                    backgroundImage: isSelected ? "linear-gradient(to right, var(--color-primary), #60a5fa)" : "none",
                                    color: isSelected ? "transparent" : "var(--auth-text)"
                                }}>
                                    {role.title}
                                </h3>
                                <p
                                    className="mt-3 text-[0.85rem] leading-relaxed font-semibold px-2"
                                    style={{ color: isSelected ? "var(--auth-text)" : "var(--auth-muted)" }}
                                >
                                    {role.description}
                                </p>
                            </div>
                        </div>
                    </motion.button>
                );
            })}
        </div>
    );
}
