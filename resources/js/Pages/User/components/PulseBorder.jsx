import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

// Builds a rounded-rect perimeter path that starts at top-center, matching
// RoleSelector's dual-beam border: one path traces clockwise, the other
// counter-clockwise, both starting/ending at the same top-center point.
function buildPulsePaths(width, height, radius) {
    const inset = 3;
    const w = Math.max(width - inset * 2, 0);
    const h = Math.max(height - inset * 2, 0);
    const r = Math.min(radius, w / 2, h / 2);
    const x0 = inset;
    const y0 = inset;
    const x1 = inset + w;
    const y1 = inset + h;
    const midX = inset + w / 2;

    const clockwise = `M ${midX} ${y0} L ${x1 - r} ${y0} Q ${x1} ${y0} ${x1} ${y0 + r} L ${x1} ${y1 - r} Q ${x1} ${y1} ${x1 - r} ${y1} L ${x0 + r} ${y1} Q ${x0} ${y1} ${x0} ${y1 - r} L ${x0} ${y0 + r} Q ${x0} ${y0} ${x0 + r} ${y0} L ${midX} ${y0}`;
    const counterClockwise = `M ${midX} ${y0} L ${x0 + r} ${y0} Q ${x0} ${y0} ${x0} ${y0 + r} L ${x0} ${y1 - r} Q ${x0} ${y1} ${x0 + r} ${y1} L ${x1 - r} ${y1} Q ${x1} ${y1} ${x1} ${y1 - r} L ${x1} ${y0 + r} Q ${x1} ${y0} ${x1 - r} ${y0} L ${midX} ${y0}`;

    return { clockwise, counterClockwise };
}

// Premium animated border stroke that traces a card's perimeter once it
// becomes complete/recorded — same effect as the RoleSelector's selected-card
// pulse border (two beams starting at top-center, one clockwise, one
// counter-clockwise), but in the theme's success green instead of blue.
//
// The path is built from the element's own measured width/height (via
// ResizeObserver) rather than a fixed viewBox, so the traced outline always
// matches the actual rendered box exactly, whatever its aspect ratio.
// `color` overrides the success/error pair when a caller grades on more than
// two levels (the dashboard also has an amber "Watch" tone).
export default function PulseBorder({ radius = 24, animate = true, abnormal = false, color: colorOverride }) {
    const svgRef = useRef(null);
    const [size, setSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const el = svgRef.current;
        if (!el) return undefined;

        const update = () => setSize({ width: el.clientWidth, height: el.clientHeight });
        update();

        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const color = colorOverride || (abnormal ? "var(--color-error)" : "var(--color-success)");
    const glowFilter = `drop-shadow(0 0 8px ${color}) drop-shadow(0 0 16px color-mix(in srgb, ${color} 60%, transparent))`;
    const { clockwise, counterClockwise } = useMemo(
        () => buildPulsePaths(size.width, size.height, radius),
        [size.width, size.height, radius]
    );

    return (
        <svg ref={svgRef} className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible">
            {size.width > 0 && size.height > 0 && (
                <>
                    <motion.path
                        d={clockwise}
                        fill="none"
                        stroke={color}
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ filter: glowFilter }}
                        initial={{ pathLength: animate ? 0 : 1 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: animate ? 3 : 0, ease: "easeInOut" }}
                    />
                    <motion.path
                        d={counterClockwise}
                        fill="none"
                        stroke={color}
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ filter: glowFilter }}
                        initial={{ pathLength: animate ? 0 : 1 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: animate ? 3 : 0, ease: "easeInOut" }}
                    />
                </>
            )}
        </svg>
    );
}
