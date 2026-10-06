import { useEffect, useLayoutEffect, useState } from "react";

/**
 * Decides whether a popover should hang below its trigger or flip above it,
 * and keeps re-deciding while it is open.
 *
 * Scroll is listened to in the capture phase so it also fires for scrollable
 * ancestors — an admin panel inside a scrolling card would otherwise never
 * report movement, and the popover would stay flipped after the space below
 * had opened back up.
 *
 * @param open      whether the popover is showing
 * @param anchorRef ref to the trigger
 * @param panelRef  ref to the popover itself; its measured height is used once
 *                  rendered, with `estimatedHeight` covering the first frame
 * @returns "bottom" | "top"
 */
export default function usePopoverPlacement(open, anchorRef, panelRef, estimatedHeight = 380) {
    const [placement, setPlacement] = useState("bottom");

    // Layout effect so the first paint is already in the right place — a
    // visible jump from bottom to top reads as a glitch.
    useLayoutEffect(() => {
        if (!open) {
            setPlacement("bottom");
            return undefined;
        }

        const update = () => {
            const anchor = anchorRef.current;
            if (!anchor) return;

            const rect = anchor.getBoundingClientRect();
            const height = panelRef.current?.offsetHeight || estimatedHeight;
            const gap = 12;

            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;

            // Only flip when below genuinely cannot fit AND above is roomier,
            // so a slightly cramped bottom does not cause needless jumping.
            setPlacement(spaceBelow < height + gap && spaceAbove > spaceBelow ? "top" : "bottom");
        };

        update();

        window.addEventListener("scroll", update, true);
        window.addEventListener("resize", update);

        return () => {
            window.removeEventListener("scroll", update, true);
            window.removeEventListener("resize", update);
        };
    }, [open, anchorRef, panelRef, estimatedHeight]);

    // Re-measure once the panel has real dimensions, since the first pass used
    // the estimate.
    useEffect(() => {
        if (!open || !panelRef.current) return undefined;

        const observer = new ResizeObserver(() => {
            const anchor = anchorRef.current;
            if (!anchor) return;

            const rect = anchor.getBoundingClientRect();
            const height = panelRef.current?.offsetHeight || estimatedHeight;
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;

            setPlacement(spaceBelow < height + 12 && spaceAbove > spaceBelow ? "top" : "bottom");
        });

        observer.observe(panelRef.current);
        return () => observer.disconnect();
    }, [open, anchorRef, panelRef, estimatedHeight]);

    return placement;
}
