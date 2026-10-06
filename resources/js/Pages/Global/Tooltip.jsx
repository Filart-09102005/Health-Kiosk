import { useState, useRef, useEffect } from "react";
import { CircleHelp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Tooltip({ text }) {
    const [isVisible, setIsVisible] = useState(false);
    const tooltipRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
                setIsVisible(false);
            }
        };

        if (isVisible) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isVisible]);

    return (
        <div 
            className="relative inline-flex items-center ml-1" 
            ref={tooltipRef}
            onClick={() => setIsVisible(!isVisible)}
        >
            <CircleHelp size={14} className="cursor-pointer transition-colors hover:text-[color:var(--color-primary)]" style={{ color: "var(--color-muted)" }} />
            
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 5, x: "-50%", scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
                        exit={{ opacity: 0, y: 5, x: "-50%", scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-1/2 z-[100] mb-2.5 w-48 rounded-lg p-2.5 text-[11px] font-bold shadow-xl leading-snug text-left"
                        style={{
                            backgroundColor: "#1e293b", // Solid Slate 800
                            color: "#ffffff",
                            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)"
                        }}
                    >
                        {text}
                        <div 
                            className="absolute left-1/2 top-full -mt-[4px] h-3 w-3 -translate-x-1/2 rotate-45"
                            style={{ 
                                backgroundColor: "#1e293b",
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
