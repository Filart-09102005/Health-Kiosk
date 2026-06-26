import { useEffect } from "react";

let openModalCount = 0;
let previousBodyOverflow = "";

export default function useModalLayer(open, { lockScroll = true } = {}) {
    useEffect(() => {
        if (! open) return undefined;

        if (openModalCount === 0) {
            previousBodyOverflow = document.body.style.overflow;
            document.body.classList.add("modal-open");

            if (lockScroll) {
                document.body.style.overflow = "hidden";
            }
        }

        openModalCount += 1;

        return () => {
            openModalCount = Math.max(0, openModalCount - 1);

            if (openModalCount === 0) {
                document.body.classList.remove("modal-open");

                if (lockScroll) {
                    document.body.style.overflow = previousBodyOverflow;
                }
            }
        };
    }, [lockScroll, open]);
}
